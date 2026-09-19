package com.careerhub.notification;

import com.careerhub.config.PageResponse;
import com.careerhub.exception.ApiException;
import com.careerhub.notification.NotificationDtos.NotificationView;
import com.careerhub.security.SecurityUtils;
import com.careerhub.user.User;
import com.careerhub.user.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/** In-app notification fan-out and inbox queries. */
@Service
@Transactional(readOnly = true)
public class NotificationService {

    private final NotificationRepository repository;
    private final UserRepository userRepository;

    public NotificationService(NotificationRepository repository, UserRepository userRepository) {
        this.repository = repository;
        this.userRepository = userRepository;
    }

    /** Creates a notification for the given user. Used by every module that changes user facing state. */
    @Transactional
    public Notification create(User user, NotificationType type, String title, String message, String link) {
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type == null ? NotificationType.ANNOUNCEMENT : type);
        notification.setLink(link);
        return repository.save(notification);
    }

    public PageResponse<NotificationView> myNotifications(int page, int size) {
        UUID userId = SecurityUtils.currentUserId();
        return PageResponse.of(repository.findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(page, size)),
                NotificationView::of);
    }

    public List<NotificationView> recent() {
        return repository.findTop5ByUserIdOrderByCreatedAtDesc(SecurityUtils.currentUserId())
                .stream().map(NotificationView::of).toList();
    }

    public long unreadCount() {
        return repository.countByUserIdAndReadFlagFalse(SecurityUtils.currentUserId());
    }

    @Transactional
    public NotificationView markRead(UUID id) {
        Notification notification = repository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Notification not found"));
        if (!notification.getUser().getId().equals(SecurityUtils.currentUserId())) {
            throw ApiException.forbidden("This notification belongs to another user");
        }
        notification.setReadFlag(true);
        return NotificationView.of(repository.save(notification));
    }

    @Transactional
    public int markAllRead() {
        return repository.markAllRead(SecurityUtils.currentUserId());
    }

    /** Resolves the authenticated user entity; used by services that must attach notifications. */
    public User currentUserEntity() {
        return userRepository.findById(SecurityUtils.currentUserId())
                .orElseThrow(() -> ApiException.unauthorized("Authentication is required"));
    }
}
