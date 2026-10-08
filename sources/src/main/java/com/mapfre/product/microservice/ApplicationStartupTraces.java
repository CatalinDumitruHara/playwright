package com.mapfre.product.microservice;

import org.springframework.core.env.Environment;

final class ApplicationStartupTraces {

	private static final String SEPARATOR = "-".repeat(58);
	private static final String BREAK = "\n";
	private static final String DEFAULT_PORT = "8080";

	private ApplicationStartupTraces() {
	}

	static String of(Environment env) {
		String applicationName = env.getProperty("spring.application.name", "application");
		String port = env.getProperty("server.port", DEFAULT_PORT);
		String contextPath = env.getProperty("server.servlet.context-path", "/");
		if (contextPath.isBlank()) {
			contextPath = "/";
		}
		String[] activeProfiles = env.getActiveProfiles();
		String profiles = activeProfiles.length == 0 ? "default" : String.join(", ", activeProfiles);

		return new StringBuilder()
			.append(BREAK).append(SEPARATOR).append(BREAK)
			.append("\tApplication '").append(applicationName).append("' is running!").append(BREAK)
			.append("\tLocal: \thttp://localhost:").append(port).append(contextPath).append(BREAK)
			.append("\tProfile(s): \t").append(profiles).append(BREAK)
			.append(SEPARATOR)
			.toString();
	}

}
