module.exports = function(grunt) {
  var config = require('./grunt-config.json'),
      d = new Date(),
      m = d.getMonth()+1,
      y = d.getFullYear(),
      dy= d.getDate(),
      h = d.getHours(),
      mn= d.getMinutes(),
      sc= d.getSeconds(),
      dt= 'grnt.'+y+'.'+m+'.'+dy+'.'+h+'.'+mn+'.'+sc+'.'+config.db.local.database+'.sql';
  grunt.initConfig({
    rsync: {
        "everything": {
            src: config.directories.local,
            dest: config.directories.hulk,
            host: config.ssh.user+"@"+config.ssh.host,
            recursive: true,
            syncDest: true,
            compareMode: "checksum",
            exclude: ['grunt-config.json', 'node_modules']
        },
        "everything-dry": {
            src: config.directories.local,
            dest: config.directories.hulk,
            host: config.ssh.user+"@"+config.ssh.host,
            recursive: true,
            syncDest: true,
            compareMode: "checksum",
            dryRun: true,
            exclude: ['grunt-config.json', 'node_modules']
        }
    },
    sshexec: {
      // This runs without fail
      makeSure: {
        command: 'mkdir -p '+config.directories.hulk,
        options: {
          host: config.ssh.host,
          username: config.ssh.user,
          privateKey: grunt.file.read(config.ssh.pubkey),
          passphrase: config.ssh.passphrase
        }
      },
      // This runs without fail
      create_db: {
        command: 'mysql -e "drop database if exists '+config.db.hulk.database+'; create database '+config.db.hulk.database+'; grant all on '+config.db.hulk.database+'.* to \''+config.db.hulk.user+'\'@\''+config.db.hulk.host+'\';"',
        options: {
          host: config.ssh.host,
          username: config.ssh.master,
          privateKey: grunt.file.read(config.ssh.pubkey),
          passphrase: config.ssh.passphrase
        }
      },
      // Need to copy stuff there beforehand
      pop_sql: {
        command: 'mysql -h'+config.db.hulk.host+' -u'+config.db.hulk.user+' -p'+config.db.hulk.password+' '+config.db.hulk.database+' < '+config.directories.hulk+'/'+dt,
        options: {
          host: config.ssh.host,
          username: config.ssh.user,
          privateKey: grunt.file.read(config.ssh.pubkey),
          passphrase: config.ssh.passphrase
        }
      },
      modify_sql: {
        command: 'mysql -h'+config.db.hulk.host+' -u'+config.db.hulk.user+' -p'+config.db.hulk.password+' -e "update '+config.db.hulk.database+'.'+config.db.prefix+'options set option_value= replace(option_value, \''+config.wordpress.local.site+'\', \''+config.wordpress.hulk.site+'\') where option_name = \'siteurl\'; update '+config.db.hulk.database+'.'+config.db.prefix+'options set option_value = replace(option_value, \''+config.wordpress.local.home+'\', \''+config.wordpress.hulk.home+'\') where option_name = \'home\';"',
        options: {
          host: config.ssh.host,
          username: config.ssh.user,
          privateKey: grunt.file.read(config.ssh.pubkey),
          passphrase: config.ssh.passphrase
        }
      },
      delete_rem_sql: {
        command: 'rm -f '+dt,
        options: {
          host: config.ssh.host,
          username: config.ssh.user,
          privateKey: grunt.file.read(config.ssh.pubkey),
          passphrase: config.ssh.passphrase
        }
      }
    },
    shell: {
      dump_mysql: {
        command: 'mysqldump -u'+config.db.local.user+' -p'+config.db.local.password+' -h'+config.db.local.host+' '+config.db.local.database+' > '+dt
      },
      copy_sql: {
        command: 'scp '+dt+' '+config.ssh.user+'@'+config.ssh.host+':'+config.directories.hulk+'/'+dt
      },
      delete_mysql: {
        command: 'rm -f '+dt
      },
      perm_copy_wpconfig: {
        command: 'mv wp-config.php wp-config-bak.php'
      },
      restore_wpconfig: {
        command: 'mv wp-config-bak.php wp-config.php'
      }

    },
    "string-replace": {
      dist: {
        files: {
          'wp-config.php': 'wp-config-bak.php'
        },
        options: {
          replacements: [{
            pattern: "define('DB_USER', '"+config.db.local.user+"');",
            replacement: "define('DB_USER', '"+config.db.hulk.user+"');"
          },
          {
            pattern: "define('DB_PASSWORD', '"+config.db.local.password.replace('$', '$$$$')+"');",
            replacement: "define('DB_PASSWORD', '"+config.db.hulk.password.replace('$', '$$$$')+"');"
          },
          {
            pattern: "define('DB_NAME', '"+config.db.local.database+"');",
            replacement: "define('DB_NAME', '"+config.db.hulk.database+"');"
          },
          {
            pattern: "define('DB_HOST', '"+config.db.local.host+"');",
            replacement: "define('DB_HOST', '"+config.db.hulk.host+"');"
          }
          ]
        }
      }
    }

  });
  grunt.loadNpmTasks('grunt-rsync');
  grunt.loadNpmTasks('grunt-ssh');
  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-string-replace');
  grunt.registerTask('d', ['sshexec:makeSure', 'rsync:everything-dry']);
  grunt.registerTask('e', ['sshexec:makeSure']);
  grunt.registerTask('m', ['shell:dump_mysql']);
  grunt.registerTask('rx', ['string-replace:dist']);
  grunt.registerTask('cdb', ['sshexec:create_db', 'sshexec:pop_sql']);
  grunt.registerTask('cp', ['sshexec:makeSure', 'shell:dump_mysql', 'shell:perm_copy_wpconfig', 'string-replace:dist', 'rsync:everything', 'sshexec:create_db', 'sshexec:pop_sql', 'sshexec:modify_sql', 'shell:restore_wpconfig', 'shell:delete_mysql', 'sshexec:delete_rem_sql']);


};