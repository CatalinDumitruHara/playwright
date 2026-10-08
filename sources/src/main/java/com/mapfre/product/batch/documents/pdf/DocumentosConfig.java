package com.mapfre.product.batch.documents.pdf;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Configuración del componente de documentos: registra {@link ComprobanteProperties}.
 */
@Configuration
@EnableConfigurationProperties(ComprobanteProperties.class)
public class DocumentosConfig {
}
