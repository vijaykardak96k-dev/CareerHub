package com.careerhub;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class CareerHubApplication {
    public static void main(String[] args) {
        SpringApplication.run(CareerHubApplication.class, args);
    }
}
