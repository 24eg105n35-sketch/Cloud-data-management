package com.clouddata.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.clouddata.entity.User;
import com.clouddata.repository.RecordRepository;
import com.clouddata.repository.UserRepository;
import com.clouddata.security.JwtService;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RecordRepository recordRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final BPlusTreeService bPlusTreeService;

    public AuthService(
            UserRepository userRepository,
            RecordRepository recordRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            BPlusTreeService bPlusTreeService
    ) {
        this.userRepository = userRepository;
        this.recordRepository = recordRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.bPlusTreeService = bPlusTreeService;
    }

    // =====================================================
    // REGISTER
    // =====================================================

    public User register(User user) {

        if (userRepository.existsByEmail(user.getEmail())) {
            throw new RuntimeException(
                    "Email already registered"
            );
        }

        user.setPassword(
                passwordEncoder.encode(
                        user.getPassword()
                )
        );

        return userRepository.save(user);
    }

    // =====================================================
    // LOGIN
    // =====================================================

    public String login(
            String email,
            String password
    ) {

        User user =
                userRepository
                        .findByEmail(email)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Invalid email or password"
                                )
                        );

        if (!passwordEncoder.matches(
                password,
                user.getPassword()
        )) {
            throw new RuntimeException(
                    "Invalid email or password"
            );
        }

        return jwtService.generateToken(user);
    }

    // =====================================================
    // DELETE ACCOUNT PERMANENTLY
    // =====================================================

    @Transactional
    public void deleteAccount(String email) {

        User user =
                userRepository
                        .findByEmail(email)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "User account not found"
                                )
                        );

        // Remove the user's B+ Tree from memory
        bPlusTreeService.removeUserTree(email);

        // Delete all records belonging to this user
        recordRepository.deleteAllByOwnerEmail(email);

        // Delete the user account
        userRepository.delete(user);
    }
}