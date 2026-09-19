package com.careerhub.company;

import com.careerhub.security.CurrentUser;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/companies")
@Tag(name = "Companies")
public class CompanyController {

    private final CompanyService service;
    private final CurrentUser currentUser;

    public CompanyController(CompanyService service, CurrentUser currentUser) {
        this.service = service;
        this.currentUser = currentUser;
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('COMPANY')")
    public CompanyDtos.CompanyView profile() {
        return CompanyDtos.CompanyView.of(service.requireByUser(currentUser.require()));
    }

    @PutMapping("/me")
    @PreAuthorize("hasRole('COMPANY')")
    public CompanyDtos.CompanyView updateProfile(@Valid @RequestBody CompanyDtos.CompanyProfileRequest request) {
        return CompanyDtos.CompanyView.of(service.updateProfile(currentUser.require(), request));
    }

    @GetMapping("/me/dashboard")
    @PreAuthorize("hasRole('COMPANY')")
    public CompanyDtos.CompanyDashboard dashboard() {
        return service.dashboard(service.requireByUser(currentUser.require()));
    }

    @GetMapping("/{id}")
    public CompanyDtos.CompanyBrief publicProfile(@PathVariable UUID id) {
        return CompanyDtos.CompanyBrief.of(service.requireById(id));
    }
}
