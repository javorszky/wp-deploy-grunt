# wp-deploy-grunt

WordPress Deployment with Gruntjs. Takes your local WordPress copy, and publishes it onto a server of your choice.

## Prerequisites

* `node` installed with `npm` on local machine (Windows users, I'm looking at you! [http://www.nodejs.org](Get them here))
* `rsync` installed on local and remote machines
* `ssh` installed (this is a given on Linux and Mac, but Windows people: [http://www.mls-software.com/opensshd.html](http://www.mls-software.com/opensshd.html))
* `mysql` installed on both local and remote machines with sufficient users.
* public key authentication set up (Windows users, read the openssh docs about it!) so you can log on to remote machine w/o password
* `grunt cli` installed globally. See [http://gruntjs.com/getting-started](http://gruntjs.com/getting-started) for more info

## Usage

Put these files on the root of your install directory (where `wp-config.php` is), run `npm install`, edit the `grunt-config.json` and `Gruntfile.js` files and hit `grunt cp` once you're done.

## Notes

This is provided as-is. I'm still figuring out the best way to do stuff, and occasionally I am running into failures and whatnot. If you could report them on the issue tracker, and present edge cases, that would be awesome.

## What does it do?

1. It connects to the remote server (which I called `hulk`, but feel free to rename it in both the `grunt-config.json` and `Gruntfile.js` files), makes sure that there is a directory to sync the files to.
2. Dumps the local database into an `.sql` file which is timestamped (and temporary anyways).
3. Renames `wp-config.php` to `wp-config-bak.php` temporarily.
4. Replaces settings in `wp-config-bak.php` and stores them in a new `wp-config.php` file, and leaves `-bak.php` intact.
5. Rsyncs the whole folder to the remote server.
6. Creates the database on the remote server. If there is one already, it drops it!
7. Populates the new database from the `.sql` file it copied across.
8. Runs modify scripts on the database (replaces home_url and site_url)
9. Restores `wp-config.php` from `wp-config-bak.php` on the local machine.
10. Deletes the mysql dump on local machine.
11. Deletes the mysql dump on remote machine.

## TODO
* make sure it replaces the guid paths in the database as well
* implement the serialized array replacements similarly to [http://interconnectit.com/products/search-and-replace-for-wordpress-databases/](http://interconnectit.com/products/search-and-replace-for-wordpress-databases/)
* make the config file more sane
