package com.careerhub.certificate;

import com.careerhub.security.CurrentUser;
import com.careerhub.student.StudentService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/certificates")
@Tag(name = "Certificates")
public class CertificateController {

    private final CertificateService service;
    private final StudentService studentService;
    private final CurrentUser currentUser;

    public CertificateController(CertificateService service, StudentService studentService, CurrentUser currentUser) {
        this.service = service;
        this.studentService = studentService;
        this.currentUser = currentUser;
    }

    @GetMapping("/mine")
    @PreAuthorize("hasRole('STUDENT')")
    public List<CertificateDtos.CertificateView> mine() {
        return service.listForStudent(studentService.requireByUser(currentUser.require())).stream()
                .map(CertificateDtos.CertificateView::of).toList();
    }

    @PostMapping
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<CertificateDtos.CertificateView> add(
            @Valid @RequestBody CertificateDtos.CertificateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(CertificateDtos.CertificateView.of(service.add(currentUser.require(), request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('STUDENT')")
    public CertificateDtos.CertificateView update(@PathVariable UUID id,
            @Valid @RequestBody CertificateDtos.CertificateRequest request) {
        return CertificateDtos.CertificateView.of(service.update(currentUser.require(), id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(currentUser.require(), id);
        return ResponseEntity.noContent().build();
    }
}
