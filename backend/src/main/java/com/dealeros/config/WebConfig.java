package com.dealeros.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("*")
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*");
    }

    // Serve uploaded vehicle files at /files/**
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String filesPath = System.getProperty("user.dir") + "/../files/";
        registry.addResourceHandler("/files/**")
                .addResourceLocations("file:" + filesPath);
    }
}
