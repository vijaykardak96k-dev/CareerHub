package com.careerhub.internship;

import com.careerhub.company.Company;
import com.careerhub.company.CompanyService;
import com.careerhub.exception.BadRequestException;
import com.careerhub.exception.ForbiddenException;
import com.careerhub.exception.NotFoundException;
import com.careerhub.job.OpeningStatus;
import com.careerhub.job.WorkMode;
import com.careerhub.skill.Skill;
import com.careerhub.skill.SkillRepository;
import com.careerhub.user.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;

@Service
@Transactional
public class InternshipService {

    private final InternshipRepository internshipRepository;
    private final SkillRepository skillRepository;
    private final CompanyService companyService;

    public InternshipService(InternshipRepository internshipRepository,
                             SkillRepository skillRepository,
                             CompanyService companyService) {
        this.internshipRepository = internshipRepository;
        this.skillRepository = skillRepository;
        this.companyService = companyService;
    }

    @Transactional(readOnly = true)
    public Page<Internship> browse(String search, String location, WorkMode workMode, Pageable pageable) {
        return internshipRepository.searchPublished(blankToNull(search), blankToNull(location), workMode, pageable);
    }

    @Transactional(readOnly = true)
    public Internship requireDetailed(UUID id) {
        return internshipRepository.findDetailed(id)
                .orElseThrow(() -> new NotFoundException("Internship not found"));
    }

    @Transactional(readOnly = true)
    public Internship requirePublished(UUID id) {
        Internship internship = requireDetailed(id);
        if (internship.getStatus() != OpeningStatus.PUBLISHED) {
            throw new NotFoundException("Internship not found");
        }
        return internship;
    }

    @Transactional(readOnly = true)
    public Page<Internship> listForCompany(User user, Pageable pageable) {
        Company company = companyService.requireByUser(user);
        return internshipRepository.findByCompany(company.getId(), pageable);
    }

    @Transactional(readOnly = true)
    public Page<Internship> listForAdmin(OpeningStatus status, Pageable pageable) {
        return internshipRepository.findAllForAdmin(status, pageable);
    }

    public Internship create(User user, InternshipDtos.InternshipRequest request) {
        Company company = companyService.requireApproved(user);
        Internship internship = new Internship();
        internship.setCompany(company);
        apply(internship, request);
        return internshipRepository.save(internship);
    }

    public Internship update(User user, UUID id, InternshipDtos.InternshipRequest request) {
        Internship internship = requireOwned(user, id);
        apply(internship, request);
        return internshipRepository.save(internship);
    }

    public Internship close(User user, UUID id) {
        Internship internship = requireOwned(user, id);
        internship.setStatus(OpeningStatus.CLOSED);
        return internshipRepository.save(internship);
    }

    public void delete(User user, UUID id) {
        internshipRepository.delete(requireOwned(user, id));
    }

    public Internship requireOwned(User user, UUID id) {
        Company company = companyService.requireByUser(user);
        Internship internship = requireDetailed(id);
        if (!internship.getCompany().getId().equals(company.getId())) {
            throw new ForbiddenException("You can only manage your own internship postings");
        }
        return internship;
    }

    private void apply(Internship internship, InternshipDtos.InternshipRequest request) {
        internship.setTitle(request.title());
        internship.setDescription(request.description());
        internship.setLocation(request.location());
        internship.setWorkMode(request.workMode());
        internship.setDurationMonths(request.durationMonths());
        internship.setStipend(request.stipend());
        internship.setEligibility(request.eligibility());
        internship.setMinCgpa(request.minCgpa());
        internship.setGraduationYear(request.graduationYear());
        internship.setDeadline(request.deadline());
        internship.setVacancies(request.vacancies());
        internship.setStatus(request.status());
        internship.setSkills(resolveSkills(request.skillIds()));
    }

    private Set<Skill> resolveSkills(Set<UUID> skillIds) {
        Set<Skill> skills = new LinkedHashSet<>();
        if (skillIds == null) {
            return skills;
        }
        for (UUID id : skillIds) {
            skills.add(skillRepository.findById(id)
                    .orElseThrow(() -> new BadRequestException("Unknown skill: " + id)));
        }
        return skills;
    }

    private String blankToNull(String value) {
        return (value == null || value.isBlank()) ? null : value;
    }
}
