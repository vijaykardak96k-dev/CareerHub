package com.careerhub.auth;

import com.careerhub.company.Company;
import com.careerhub.company.CompanyRepository;
import com.careerhub.company.CompanyStatus;
import com.careerhub.exception.BadRequestException;
import com.careerhub.exception.ConflictException;
import com.careerhub.exception.ForbiddenException;
import com.careerhub.security.JwtService;
import com.careerhub.student.Student;
import com.careerhub.student.StudentRepository;
import com.careerhub.student.StudentService;
import com.careerhub.user.Role;
import com.careerhub.user.User;
import com.careerhub.user.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final CompanyRepository companyRepository;
    private final StudentService studentService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository,
                       StudentRepository studentRepository,
                       CompanyRepository companyRepository,
                       StudentService studentService,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService) {
        this.userRepository = userRepository;
        this.studentRepository = studentRepository;
        this.companyRepository = companyRepository;
        this.studentService = studentService;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    /**
     * Self registration is available for students and companies only. College admin
     * accounts are provisioned by the college.
     */
    public AuthDtos.AuthResponse register(AuthDtos.RegisterRequest request) {
        if (request.role() == Role.COLLEGE_ADMIN) {
            throw new ForbiddenException("College administrator accounts cannot be self registered");
        }
        if (userRepository.existsByEmailIgnoreCase(request.email())) {
            throw new ConflictException("An account with this email already exists");
        }

        User user = new User();
        user.setEmail(request.email().toLowerCase());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(request.role());
        user.setActive(true);
        User savedUser = userRepository.save(user);

        if (request.role() == Role.STUDENT) {
            if (request.fullName() == null || request.fullName().isBlank()) {
                throw new BadRequestException("Full name is required for a student account");
            }
            Student student = new Student();
            student.setUser(savedUser);
            student.setFullName(request.fullName());
            Student savedStudent = studentRepository.save(student);
            studentService.recalculateCompletion(savedStudent);
        } else {
            if (request.companyName() == null || request.companyName().isBlank()) {
                throw new BadRequestException("Company name is required for a company account");
            }
            Company company = new Company();
            company.setUser(savedUser);
            company.setName(request.companyName());
            company.setContactEmail(savedUser.getEmail());
            company.setStatus(CompanyStatus.PENDING);
            companyRepository.save(company);
        }

        return buildResponse(savedUser);
    }

    /** Business rule: deactivated accounts cannot obtain a token. */
    public AuthDtos.AuthResponse login(AuthDtos.LoginRequest request) {
        User user = userRepository.findByEmailIgnoreCase(request.email())
                .orElseThrow(() -> new BadRequestException("Invalid email or password"));
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BadRequestException("Invalid email or password");
        }
        if (!user.isActive()) {
            throw new ForbiddenException("This account has been deactivated. Please contact the college office.");
        }
        return buildResponse(user);
    }

    public void changePassword(User user, AuthDtos.ChangePasswordRequest request) {
        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new BadRequestException("The current password is not correct");
        }
        if (passwordEncoder.matches(request.newPassword(), user.getPasswordHash())) {
            throw new BadRequestException("The new password must be different from the current password");
        }
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public AuthDtos.AccountView currentAccount(User user) {
        return toAccountView(user);
    }

    private AuthDtos.AuthResponse buildResponse(User user) {
        return new AuthDtos.AuthResponse(jwtService.generateToken(user), jwtService.getExpirationMs(),
                toAccountView(user));
    }

    private AuthDtos.AccountView toAccountView(User user) {
        String displayName = user.getEmail();
        String companyStatus = null;
        Integer profileCompletion = null;

        if (user.getRole() == Role.STUDENT) {
            Student student = studentRepository.findByUserId(user.getId()).orElse(null);
            if (student != null) {
                displayName = student.getFullName();
                profileCompletion = student.getProfileCompletion();
            }
        } else if (user.getRole() == Role.COMPANY) {
            Company company = companyRepository.findByUserId(user.getId()).orElse(null);
            if (company != null) {
                displayName = company.getName();
                companyStatus = company.getStatus().name();
            }
        } else {
            displayName = "College Administrator";
        }
        return new AuthDtos.AccountView(user.getId(), user.getEmail(), user.getRole(), displayName,
                user.isActive(), companyStatus, profileCompletion);
    }
}
