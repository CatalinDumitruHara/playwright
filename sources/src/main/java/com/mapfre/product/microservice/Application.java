package com.mapfre.product.microservice;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.core.env.Environment;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.config.annotation.PathMatchConfigurer;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

// Monta también el componente de documentos (ARC-016, TSK-008)
@SpringBootApplication(scanBasePackages = {"com.mapfre.product.microservice", "com.mapfre.product.batch.documents"})
public class Application implements WebMvcConfigurer {

	/** Base pública de la API: {@code servers[0].url} de openapi.yaml. */
	public static final String API_BASE_PATH = "/api";

	private static final Logger log = LoggerFactory.getLogger(Application.class);

	public static void main(String[] args) {
		Environment env = SpringApplication.run(Application.class, args).getEnvironment();

		if (log.isInfoEnabled()) {
			log.info(ApplicationStartupTraces.of(env));
		}
	}

	/**
	 * Monta todos los controllers REST del producto (p. ej. UsuarioController) bajo la base
	 * pública del contrato, de modo que la URL pública sea {@code /api + path del contrato}.
	 * Actuator queda fuera del prefijo.
	 */
	@Override
	public void configurePathMatch(PathMatchConfigurer configurer) {
		configurer.addPathPrefix(API_BASE_PATH,
				c -> c.isAnnotationPresent(RestController.class)
						&& c.getPackageName().startsWith(Application.class.getPackageName()));
	}

}
