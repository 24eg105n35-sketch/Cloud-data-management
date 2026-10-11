package com.clouddata.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.clouddata.entity.User;
import com.clouddata.service.AuthService;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;

    public AuthController(
            AuthService authService
    ) {
        this.authService = authService;
    }

    // =====================================================
    // REGISTER
    // =====================================================

    @PostMapping("/register")
    public ResponseEntity<?> register(
            @RequestBody User user
    ) {

        try {

            User savedUser =
                    authService.register(user);

            Map<String, Object> response =
                    new HashMap<>();

            response.put(
                    "message",
                    "Registration successful"
            );

            response.put(
                    "id",
                    savedUser.getId()
            );

            response.put(
                    "name",
                    savedUser.getName()
            );

            response.put(
                    "email",
                    savedUser.getEmail()
            );

            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(response);

        } catch (RuntimeException e) {

            Map<String, String> response =
                    new HashMap<>();

            response.put(
                    "message",
                    e.getMessage()
            );

            return ResponseEntity
                    .badRequest()
                    .body(response);
        }
    }

    // =====================================================
    // LOGIN
    // =====================================================

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody User user
    ) {

        try {

            String token =
                    authService.login(
                            user.getEmail(),
                            user.getPassword()
                    );

            Map<String, Object> response =
                    new HashMap<>();

            response.put(
                    "message",
                    "Login successful"
            );

            response.put(
                    "token",
                    token
            );

            response.put(
                    "email",
                    user.getEmail()
            );

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {

            Map<String, String> response =
                    new HashMap<>();

            response.put(
                    "message",
                    e.getMessage()
            );

            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(response);
        }
    }

    // =====================================================
    // DELETE ACCOUNT PERMANENTLY
    // =====================================================

    @DeleteMapping("/account")
    public ResponseEntity<?> deleteAccount(
            @AuthenticationPrincipal User user
    ) {

        try {

            String email =
                    user.getEmail();

            authService.deleteAccount(email);

            Map<String, String> response =
                    new HashMap<>();

            response.put(
                    "message",
                    "Account and all associated records deleted permanently."
            );

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {

            Map<String, String> response =
                    new HashMap<>();

            response.put(
                    "message",
                    e.getMessage()
            );

            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(response);
        }
    }
}