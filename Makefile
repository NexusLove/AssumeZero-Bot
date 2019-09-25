m = "Update commands" # Commit message parameter option in invocation

all:
	git add .
	git commit -m $(m)
	git push origin
enable:
	heroku ps:scale web=1 -a hivenetfb
disable:
	heroku ps:scale web=0 -a hivenetfb
restart:
	heroku ps:restart web -a hivenetfb
logs:
	heroku logs -n 100 -a hivenetfb
start:
	npm start
archive:
	node src/archive.js
restore:
	node src/archive.js --restore
bash:
	heroku run bash -a hivenetfb
logout:
	node src/login.js --logout
debug: disable start
snapshot: archive restore
