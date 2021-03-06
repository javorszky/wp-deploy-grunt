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
            syncDestIgnoreExcl: true,
            compareMode: "checksum",
            exclude: ['grunt-config.json', 'node_modules', '*.sublime-*', '*.psd', '.*']
        },
        "everything-dry": {
            src: config.directories.local,
            dest: config.directories.hulk,
            host: config.ssh.user+"@"+config.ssh.host,
            recursive: true,
            syncDestIgnoreExcl: true,
            compareMode: "checksum",
            dryRun: true,
            exclude: ['grunt-config.json', 'node_modules', '*.sublime-*', '*.psd', '.*']
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

      create_db: {
        command: 'mysql -e "drop database if exists '+config.db.hulk.database+'; create database '+config.db.hulk.database+'; grant all on '+config.db.hulk.database+'.* to \''+config.db.hulk.user+'\'@\''+config.db.hulk.host+'\';"',
        options: {
          host: config.ssh.host,
          username: config.ssh.master,
          privateKey: grunt.file.read(config.ssh.pubkey),
          passphrase: config.ssh.passphrase
        }
      },

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
      },
      export_rem_sql: {
        command: 'mysqldump -u'+config.db.hulk.user+' -p'+config.db.hulk.password+' -h'+config.db.hulk.host+' '+config.db.hulk.database+' > '+config.directories.hulk+dt,
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
      delete_perm_wpconfig: {
        command: 'rm -f wp-config-bak.php'
      },
      perm_copy_wpconfig: {
        command: 'mv wp-config.php wp-config-bak.php'
      },
      restore_wpconfig: {
        command: 'mv wp-config-bak.php wp-config.php'
      },
      get_remote_files: {
        command: 'rsync -rchazP --stats '+config.ssh.master+'@'+config.ssh.host+':'+config.directories.hulk+' '+config.directories.local
      },
      create_db: {
        command: 'mysql -h'+config.db.local.host+' -u'+config.db.local.user+' -p'+config.db.local.password+' -e "drop database if exists '+config.db.local.database+'; create database '+config.db.local.database+'; grant all on '+config.db.local.database+'.* to \''+config.db.local.user+'\'@\''+config.db.local.host+'\';"'
      },
      pop_local_db: {
        command: 'mysql -h'+config.db.local.host+' -u'+config.db.local.user+' -p'+config.db.local.password+' '+config.db.local.database+' < '+config.directories.local+dt
      },
      pop_local_db_2: {
        command: 'mysql -h'+config.db.local.host+' -u'+config.db.local.user+' -p'+config.db.local.password+' '+config.db.local.database+' < '+config.directories.local+'donate_mobile_2.sql'
      },
      modify_local_sql: {
        command: 'mysql -h'+config.db.local.host+' -u'+config.db.local.user+' -p'+config.db.local.password+' -e "update '+config.db.local.database+'.'+config.db.prefix+'options set option_value= replace(option_value, \''+config.wordpress.hulk.site+'\', \''+config.wordpress.local.site+'\') where option_name = \'siteurl\'; update '+config.db.local.database+'.'+config.db.prefix+'options set option_value = replace(option_value, \''+config.wordpress.hulk.home+'\', \''+config.wordpress.local.home+'\') where option_name = \'home\';"'
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
          }]
        }
      },
      pulling_remote: {
          options: {
            replacements: [{
              pattern: "define('DB_USER', '"+config.db.hulk.user+"');",
              replacement: "define('DB_USER', '"+config.db.local.user+"');"
            },
            {
              pattern: "define('DB_PASSWORD', '"+config.db.hulk.password.replace('$', '$$$$')+"');",
              replacement: "define('DB_PASSWORD', '"+config.db.local.password.replace('$', '$$$$')+"');"
            },
            {
              pattern: "define('DB_NAME', '"+config.db.hulk.database+"');",
              replacement: "define('DB_NAME', '"+config.db.local.database+"');"
            },
            {
              pattern: "define('DB_HOST', '"+config.db.hulk.host+"');",
              replacement: "define('DB_HOST', '"+config.db.local.host+"');"
            }
            ]
          },
          files: {
            'wp-config.php': 'wp-config-bak.php'
          }
        }
    },
    compass: {
      dist: {
        options: {
          config: 'wp-content/themes/ocm/config.rb',
          specify: ['wp-content/themes/ocm/**/style.sass']
        }
      }
    },
    watch: {
      compass: {
        files: ['wp-content/themes/**/*.sass'],
        tasks: ['compass', 'sshexec:makeSure', 'shell:perm_copy_wpconfig', 'string-replace:dist', 'rsync:everything', 'shell:restore_wpconfig']
      },
      local_sass: {
        files: ['wp-content/themes/**/*.sass'],
        tasks: ['compass']
      },
      local_js: {
        files: ['wp-content/themes/ocm/**/*.js']
      },
      all: {
        files: ['wp-content/**/*.*'],
        tasks: ['sshexec:makeSure', 'shell:perm_copy_wpconfig', 'string-replace:dist', 'rsync:everything', 'shell:restore_wpconfig']
      }

    },

  });
  grunt.loadNpmTasks('grunt-rsync');
  grunt.loadNpmTasks('grunt-ssh');
  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-string-replace');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-compass');

  grunt.registerTask('d', ['sshexec:makeSure', 'rsync:everything-dry']);
  grunt.registerTask('default', ['watch:all']);

  grunt.registerTask('pull', ['sshexec:export_rem_sql', 'shell:get_remote_files', 'shell:perm_copy_wpconfig', 'string-replace:pulling_remote', 'shell:create_db', 'shell:pop_local_db', 'shell:modify_local_sql', 'sshexec:delete_rem_sql', 'shell:delete_mysql', 'shell:delete_perm_wpconfig']);
  grunt.registerTask('pull-nodb', ['shell:get_remote_files', 'shell:perm_copy_wpconfig', 'string-replace:pulling_remote', 'shell:delete_perm_wpconfig']);

  grunt.registerTask('push', ['sshexec:makeSure', 'shell:dump_mysql', 'shell:perm_copy_wpconfig', 'string-replace:dist', 'rsync:everything', 'sshexec:create_db', 'sshexec:pop_sql', 'sshexec:modify_sql', 'shell:restore_wpconfig', 'shell:delete_mysql']);
  grunt.registerTask('push-nodb', ['sshexec:makeSure', 'shell:perm_copy_wpconfig', 'string-replace:dist', 'rsync:everything', 'shell:restore_wpconfig']);
};