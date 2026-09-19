package com.careerhub.analytics;

import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/analytics")
@PreAuthorize("hasRole('COLLEGE_ADMIN')")
@Tag(name = "Analytics")
public class AnalyticsController {

    private final AnalyticsService service;

    public AnalyticsController(AnalyticsService service) {
        this.service = service;
    }

    @GetMapping("/overview")
    public AnalyticsDtos.AdminOverview overview() {
        return service.overview();
    }

    @GetMapping("/summary")
    public AnalyticsDtos.AnalyticsSummary summary() {
        return service.summary();
    }
}
