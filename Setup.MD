###Notes for setup server

---run migrations manually

sudo docker compose up -d
sudo docker compose exec web python manage.py migrate



--completely clean docker images container and volumes (fresh start)
sudo docker compose down --volumes --remove-orphans
sudo docker rm -f $(sudo docker ps -aq)
sudo docker rmi -f $(sudo docker images -aq)
sudo docker volume rm $(sudo docker volume ls -q)


--confirm everything has been removed
sudo docker ps -a
sudo docker images
sudo docker volume ls


--copyig folder /files to server
rsync -av --progress --exclude='.DS_Store' --exclude='venv' ./ calabash@192.168.8.107:/home/calabash/pasmenpasara
