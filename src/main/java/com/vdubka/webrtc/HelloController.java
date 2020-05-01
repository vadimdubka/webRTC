package com.vdubka.webrtc;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(value = "/api")
public class HelloController {

    @GetMapping(value = "/v1/hello")
    public String hello() {
        return "Hello @vdubka!";
    }
}
