package com.medicareplus.user;

import com.medicareplus.common.exception.BusinessException;
import com.medicareplus.common.exception.ResourceNotFoundException;
import com.medicareplus.support.TestDataFactory;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserServiceImpl service;

    @Test
    void createUserShouldEncodePasswordAndMapResponse() {
        UserRequest request = new UserRequest();
        request.setUsername("alice");
        request.setPassword("secret");
        request.setEmail("alice@test.com");
        request.setFirstName("Alice");
        request.setLastName("Doe");
        request.setPhone("0700");
        request.setRole(UserRole.ADMIN);

        when(passwordEncoder.encode("secret")).thenReturn("encoded");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(1L);
            return user;
        });

        UserResponse response = service.createUser(request);

        assertEquals(1L, response.getId());
        assertEquals("alice", response.getUsername());
        assertEquals("ADMIN", response.getRole());
    }

    @Test
    void createUserShouldRejectDuplicateEmail() {
        UserRequest request = new UserRequest();
        request.setUsername("alice");
        request.setEmail("alice@test.com");
        when(userRepository.existsByUsername("alice")).thenReturn(false);
        when(userRepository.existsByEmail("alice@test.com")).thenReturn(true);

        assertThrows(BusinessException.class, () -> service.createUser(request));
        verify(userRepository, never()).save(any());
    }

    @Test
    void createUserShouldRejectDuplicateUsername() {
        UserRequest request = new UserRequest();
        request.setUsername("taken");

        when(userRepository.existsByUsername("taken")).thenReturn(true);

        assertThrows(BusinessException.class, () -> service.createUser(request));
        verify(userRepository, never()).save(any());
    }

    @Test
    void getUserByIdShouldMapResponse() {
        User user = TestDataFactory.user(11L, "mapped-user", UserRole.DOCTOR);
        when(userRepository.findById(11L)).thenReturn(Optional.of(user));

        UserResponse response = service.getUserById(11L);

        assertEquals(11L, response.getId());
        assertEquals("mapped-user", response.getUsername());
        assertEquals("DOCTOR", response.getRole());
    }

    @Test
    void getUserByUsernameShouldThrowWhenMissing() {
        when(userRepository.findByUsername("missing")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.getUserByUsername("missing"));
    }

    @Test
    void getAllUsersShouldMapResponses() {
        when(userRepository.findAll()).thenReturn(List.of(TestDataFactory.user(2L, "doctor", UserRole.DOCTOR)));

        List<UserResponse> responses = service.getAllUsers();

        assertEquals(1, responses.size());
        assertEquals("doctor", responses.getFirst().getUsername());
    }

    @Test
    void updateUserShouldRejectDuplicateUsername() {
        User existing = TestDataFactory.user(3L, "current", UserRole.ADMIN);
        UserRequest request = new UserRequest();
        request.setUsername("taken");
        request.setEmail(existing.getEmail());
        request.setPassword("secret");

        when(userRepository.findById(3L)).thenReturn(Optional.of(existing));
        when(userRepository.existsByUsername("taken")).thenReturn(true);

        assertThrows(BusinessException.class, () -> service.updateUser(3L, request));
    }

    @Test
    void updateUserShouldPersistEncodedPasswordAndUpdatedFields() {
        User existing = TestDataFactory.user(12L, "current", UserRole.ADMIN);
        UserRequest request = new UserRequest();
        request.setUsername("updated");
        request.setEmail("updated@test.com");
        request.setPassword("new-secret");
        request.setFirstName("Updated");
        request.setLastName("User");
        request.setPhone("0711");
        request.setRole(UserRole.DOCTOR);

        when(userRepository.findById(12L)).thenReturn(Optional.of(existing));
        when(userRepository.existsByUsername("updated")).thenReturn(false);
        when(userRepository.existsByEmail("updated@test.com")).thenReturn(false);
        when(passwordEncoder.encode("new-secret")).thenReturn("encoded-secret");
        when(userRepository.save(existing)).thenReturn(existing);

        UserResponse response = service.updateUser(12L, request);

        assertEquals("updated", response.getUsername());
        assertEquals("updated@test.com", response.getEmail());
        assertEquals("DOCTOR", response.getRole());
    }

    @Test
    void deleteUserShouldThrowWhenMissing() {
        when(userRepository.existsById(10L)).thenReturn(false);

        assertThrows(ResourceNotFoundException.class, () -> service.deleteUser(10L));
    }

    @Test
    void deleteUserShouldDeleteWhenPresent() {
        when(userRepository.existsById(13L)).thenReturn(true);

        service.deleteUser(13L);

        verify(userRepository).deleteById(13L);
    }
}
