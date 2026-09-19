package com.careerhub.admin;

import com.careerhub.exception.BadRequestException;
import com.careerhub.exception.NotFoundException;
import com.careerhub.notification.NotificationService;
import com.careerhub.notification.NotificationType;
import com.careerhub.user.Role;
import com.careerhub.user.User;
import com.careerhub.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class AdminService {

    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public AdminService(UserRepository userRepository, NotificationService notificationService) {
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    /** Business rule: deactivated users cannot log in. Admin accounts cannot deactivate themselves. */
    public User setActive(User actor, UUID userId, boolean active) {
        User target = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));
        if (target.getId().equals(actor.getId())) {
            throw new BadRequestException("You cannot change the status of your own account");
        }
        target.setActive(active);
        return userRepository.save(target);
    }

    public int announce(AdminDtos.AnnouncementRequest request) {
        List<User> recipients = new ArrayList<>();
        switch (request.audience()) {
            case STUDENTS -> recipients.addAll(userRepository.findAllByRole(Role.STUDENT));
            case COMPANIES -> recipients.addAll(userRepository.findAllByRole(Role.COMPANY));
            case ALL -> {
                recipients.addAll(userRepository.findAllByRole(Role.STUDENT));
                recipients.addAll(userRepository.findAllByRole(Role.COMPANY));
            }
        }
        for (User recipient : recipients) {
            notificationService.create(recipient, NotificationType.ANNOUNCEMENT,
                    request.title(), request.message(), null);
        }
        return recipients.size();
    }
}
