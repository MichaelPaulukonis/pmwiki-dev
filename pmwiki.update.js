// http://stackoverflow.com/questions/11944932/how-to-download-a-file-with-node-js

// see also: http://www.hacksparrow.com/using-node-js-to-download-files.html

var pmwikiupdate = function() {

    var http = require('http'),
        fs = require('fs-extra'),
        exec = require('child_process').execSync,
        spawn = require('child_process').spawn,
        projectRoot = 'C:/dev/xampp/htdocs/projects/',
        config = require('./pmwiki.config');


    var download = function(url, dest, cb) {
        var file = fs.createWriteStream(dest);
        var request = http.get(url, function(response) {
            response.pipe(file);
            file.on('finish', function() {
                file.close(cb);  // close() is async, call cb after close completes.
            });
        }).on('error', function(err) { // Handle errors
            fs.unlink(dest); // Delete the file async. (But we don't check the result)
            if (cb) cb(err.message);
        });
    };

    // see also: http://unix.stackexchange.com/questions/59276/how-to-extract-only-a-specific-folder-from-a-zipped-archive-to-a-given-directory
    var unzip = function(file, dest) {

        console.log('unzip');

        var cmd = 'unzip {{FILE}} -d {{DEST}}'
                .replace(/{{FILE}}/, file).replace(/{{DEST}}/, dest);
        console.log(cmd);
        var child = exec(cmd, function(err, stdout, stderr) {
            console.log(arguments);
            if (err) {
                console.log(err);
            } else {
                console.log('extracted to: ' + dest);
            };
        });

        var contents = fs.readdirSync(dest);
        console.log(contents);
        var c2 = fs.readdirSync(dest + contents[0]);

        for (var i = 0, len = c2.length; i < len; i++) {
            fs.renameSync(dest + contents[0] + '/' + c2[i], dest + c2[i]);
        }

        // dang FAILING
        // HOWEVER: NOT THAT BIG A DEAL
        // fs.unlinkSync(dest + contents[0]);

    };

    // waaaah! not added to the hosts file!
    // soooo.... how to access?
    var addVHostsEntry = function(dest) {

        var loc = 'c:/dev/xampp/apache/conf/extra/httpd-vhosts.conf';

        var template = `
<VirtualHost *:81>
    DocumentRoot "${dest}"
    <Directory "${dest}">
        Options Indexes FollowSymLinks Includes ExecCGI
        Order allow,deny
        Allow from all
    </Directory>
</VirtualHost>`;


        // it's asynchronous, you know....
        fs.appendFile(loc, template, function(err) {
            if (err) console.log(err);
        });

    };

    var installExtras = function(path, name) {

        var file = 'd:/projects/dev-scripts/cookbooks/bootstrap-skin.0.2.5.zip';
        var dest = path + 'pub/skins/';
        console.log(`unzipping ${file} to ${dest}`);
        unzip(file, dest);

        var newConfig = `
$Skin = 'bootstrap-fluid';

##  $WikiTitle is the name that appears in the browser's title bar.
$WikiTitle = '${name}';`;

        var localConfig = path + 'local/config.php';

        // TODO: copy this file d:\projects\dev-scripts\test\docs\sample-config.php
        var sampleConfig = path + '/docs/sample-config.php';
        fs.copySync(sampleConfig, localConfig);

        console.log(`configPath: ${localConfig}`);

        fs.appendFileSync(localConfig, newConfig);


    };


    var restartXampp = function() {
        // https://www.apachefriends.org/faq_windows.html
        // C:\dev\xampp
        // c:\dev\xampp\xampp_Start.exe
        // TODO: if its not already running, this fails...

        var stop = 'c:/dev/xampp/xampp_stop.exe';
        var start = 'c:/dev/xampp/xampp_Start.exe &';
        console.log('.... stopping XAMPP ....');
        var child = exec(stop);
        process.stdout.write(child);
        console.log('.... starting XAMPP ....');
        child = exec(start);
        process.stdout.write(child);
    };

    var tempname = function() {
        var temp = 'pmwiki.' + (Math.random() * 0x1000000000).toString(36);
        return temp;
    };

    var url = 'http://www.pmwiki.org/pub/pmwiki/pmwiki-latest.zip';
    var targ = 'latest.zip';


    var processZip = function() {
        var name = tempname();
        var temper = name + '/';
        var newloc = projectRoot + temper;
        unzip(targ, newloc);

        // TODO: install extras
        installExtras(newloc, name);
        addVHostsEntry(newloc);
        var path = 'http://localhost:81/projects/' + temper + 'pmwiki.php';
        console.log(path);
        restartXampp();
        exec(`start ${path}`);
    };

    if (config.useLocal) {
        console.log('locally sourced');
        processZip();
    } else {
        console.log('downloading....');
        download(url, targ, processZip);
    }

}();
