package com.dealeros;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class DealerOsApplication {

    public static void main(String[] args) {
        SpringApplication.run(DealerOsApplication.class, args);
    }
}
