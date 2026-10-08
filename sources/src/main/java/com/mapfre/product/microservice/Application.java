package com.mapfre.product.microservice;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.core.env.Environment;

@SpringBootApplication
public class Application {

	private static final Logger log = LoggerFactory.getLogger(Application.class);

	public static void main(String[] args) {
		Environment env = SpringApplication.run(Application.class, args).getEnvironment();

		if (log.isInfoEnabled()) {
			log.info(ApplicationStartupTraces.of(env));
		}
	}

}
