package com.careerhub.certificate;

import com.careerhub.exception.BadRequestException;
import com.careerhub.exception.ForbiddenException;
import com.careerhub.exception.NotFoundException;
import com.careerhub.notification.NotificationService;
import com.careerhub.notification.NotificationType;
import com.careerhub.student.Student;
import com.careerhub.student.StudentService;
import com.careerhub.user.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class CertificateService {

    private final CertificateRepository repository;
    private final StudentService studentService;
    private final NotificationService notificationService;

    public CertificateService(CertificateRepository repository,
                              StudentService studentService,
                              NotificationService notificationService) {
        this.repository = repository;
        this.studentService = studentService;
        this.notificationService = notificationService;
    }

    @Transactional(readOnly = true)
    public List<Certificate> listForStudent(Student student) {
        return repository.findByStudentIdOrderByCreatedAtDesc(student.getId());
    }

    public Certificate add(User user, CertificateDtos.CertificateRequest request) {
        Student student = studentService.requireByUser(user);
        Certificate certificate = new Certificate();
        certificate.setStudent(student);
        apply(certificate, request);
        Certificate saved = repository.save(certificate);
        studentService.recalculateCompletion(student);
        return saved;
    }

    public Certificate update(User user, UUID id, CertificateDtos.CertificateRequest request) {
        Student student = studentService.requireByUser(user);
        Certificate certificate = require(id);
        if (!certificate.getStudent().getId().equals(student.getId())) {
            throw new ForbiddenException("You can only modify your own certificates");
        }
        if (certificate.getStatus() == CertificateStatus.VERIFIED) {
            throw new BadRequestException("A verified certificate can no longer be edited");
        }
        apply(certificate, request);
        certificate.setStatus(CertificateStatus.PENDING);
        return repository.save(certificate);
    }

    public void delete(User user, UUID id) {
        Student student = studentService.requireByUser(user);
        Certificate certificate = require(id);
        if (!certificate.getStudent().getId().equals(student.getId())) {
            throw new ForbiddenException("You can only delete your own certificates");
        }
        repository.delete(certificate);
        studentService.recalculateCompletion(student);
    }

    @Transactional(readOnly = true)
    public Page<Certificate> listForAdmin(CertificateStatus status, Pageable pageable) {
        return repository.findAllForAdmin(status, pageable);
    }

    /** College admin verification. The student is notified about the outcome. */
    public Certificate review(UUID id, CertificateDtos.ReviewRequest request) {
        if (request.status() == CertificateStatus.PENDING) {
            throw new BadRequestException("Review outcome must be VERIFIED or REJECTED");
        }
        Certificate certificate = repository.findDetailed(id)
                .orElseThrow(() -> new NotFoundException("Certificate not found"));
        certificate.setStatus(request.status());
        certificate.setReviewNote(request.note());
        certificate.setReviewedAt(Instant.now());
        Certificate saved = repository.save(certificate);

        boolean verified = request.status() == CertificateStatus.VERIFIED;
        notificationService.create(certificate.getStudent().getUser(),
                verified ? NotificationType.CERTIFICATE_VERIFIED : NotificationType.CERTIFICATE_REJECTED,
                verified ? "Certificate verified" : "Certificate rejected",
                certificate.getName() + (verified ? " has been verified by the college."
                        : " was rejected. " + (request.note() == null ? "" : request.note())),
                "/student/certificates");
        return saved;
    }

    private Certificate require(UUID id) {
        return repository.findDetailed(id).orElseThrow(() -> new NotFoundException("Certificate not found"));
    }

    private void apply(Certificate certificate, CertificateDtos.CertificateRequest request) {
        certificate.setName(request.name());
        certificate.setIssuingOrganization(request.issuingOrganization());
        certificate.setIssueDate(request.issueDate());
        certificate.setCredentialId(request.credentialId());
        certificate.setCredentialUrl(request.credentialUrl());
    }
}
