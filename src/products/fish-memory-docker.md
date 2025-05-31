sudo service docker start


docker ps -a        # Lists all containers (including stopped ones)
docker images       # Lists downloaded images


docker rm $(docker ps -aq)      # Removes all containers
docker rmi $(docker images -q)  # Removes all images


# Build the Docker Image
docker build -t demo-ecommerce .


# Run the Container with the .env File Mounted
docker run --env-file .env -p 3000:3000 demo-ecommerce
