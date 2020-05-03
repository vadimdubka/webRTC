# To test:
http://localhost:8080/api/v1/hello
http://localhost:8080/api/v1/index.html

http://ec2-13-53-35-183.eu-north-1.compute.amazonaws.com:8080/api/v1/hello
http://ec2-13-53-35-183.eu-north-1.compute.amazonaws.com:8080/index.html

```shell
# download jar on EC2
scp -i vdWebRTC.pem build\libs\webrtc-0.0.2-SNAPSHOT.jar  ec2-user@ec2-13-53-35-183.eu-north-1.compute.amazonaws.com:~
webrtc-0.0.2-SNAPSHOT.jar

# To kill any process listening to the port 8080:
kill $(lsof -t -i:8080)
```
