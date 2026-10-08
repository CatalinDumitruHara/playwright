package com.mapfre.product.microservice.users.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public record HierarchyList(
        @JsonProperty("items") List<HierarchyItem> items,
        @JsonProperty("total") int total,
        @JsonProperty("page") int page,
        @JsonProperty("size") int size) {
}
