logger covid_update_start
python get.py
logger covid_update_end
echo "date" > lastupdate
date >> lastupdate

#git fetch --all && git checkout --force "origin/master"
