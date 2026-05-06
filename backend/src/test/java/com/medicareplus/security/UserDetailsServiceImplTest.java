package com.medicareplus.security;

import com.medicareplus.support.TestDataFactory;
import com.medicareplus.user.User;
import com.medicareplus.user.UserRepository;
import com.medicareplus.user.UserRole;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserDetailsServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserDetailsServiceImpl service;

    @Test
    void loadUserByUsernameShouldReturnSpringSecurityUser() {
        User user = TestDataFactory.user(1L, "doctor", UserRole.DOCTOR);
        when(userRepository.findByUsername("doctor")).thenReturn(Optional.of(user));

        UserDetails details = service.loadUserByUsername("doctor");

        assertEquals("doctor", details.getUsername());
        assertEquals(user.getPassword(), details.getPassword());
        assertEquals("ROLE_DOCTOR", details.getAuthorities().iterator().next().getAuthority());
    }

    @Test
    void loadUserByUsernameShouldThrowWhenMissing() {
        when(userRepository.findByUsername("missing")).thenReturn(Optional.empty());

        assertThrows(UsernameNotFoundException.class, () -> service.loadUserByUsername("missing"));
    }
}
