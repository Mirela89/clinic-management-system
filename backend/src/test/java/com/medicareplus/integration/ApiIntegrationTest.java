package com.medicareplus.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.medicareplus.appointment.Appointment;
import com.medicareplus.appointment.AppointmentRepository;
import com.medicareplus.appointment.AppointmentRequest;
import com.medicareplus.appointment.AppointmentStatus;
import com.medicareplus.department.Department;
import com.medicareplus.department.DepartmentRepository;
import com.medicareplus.department.DepartmentRequest;
import com.medicareplus.doctor.Doctor;
import com.medicareplus.doctor.DoctorRepository;
import com.medicareplus.patient.BloodType;
import com.medicareplus.patient.Patient;
import com.medicareplus.patient.PatientRepository;
import com.medicareplus.user.RegisterRequest;
import com.medicareplus.user.User;
import com.medicareplus.user.UserRepository;
import com.medicareplus.user.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class ApiIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @BeforeEach
    void setUp() {
        appointmentRepository.deleteAll();
        patientRepository.deleteAll();
        doctorRepository.deleteAll();
        departmentRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void registerShouldCreatePatientUserAndPersistEncodedPassword() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("patient.integration");
        request.setPassword("secret123");
        request.setEmail("patient.integration@example.com");
        request.setFirstName("Patient");
        request.setLastName("Integration");
        request.setPhone("0712345678");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("User registered successfully."))
                .andExpect(jsonPath("$.data").doesNotExist());

        User savedUser = userRepository.findByUsername("patient.integration").orElseThrow();
        assertThat(savedUser.getRole()).isEqualTo(UserRole.PATIENT);
        assertThat(savedUser.getEmail()).isEqualTo("patient.integration@example.com");
        assertThat(passwordEncoder.matches("secret123", savedUser.getPassword())).isTrue();
    }

    @Test
    void registerShouldRejectDuplicateUsername() throws Exception {
        User existingUser = new User();
        existingUser.setUsername("duplicate.user");
        existingUser.setPassword(passwordEncoder.encode("password123"));
        existingUser.setEmail("existing.user@example.com");
        existingUser.setFirstName("Existing");
        existingUser.setLastName("User");
        existingUser.setPhone("0700000000");
        existingUser.setRole(UserRole.PATIENT);
        userRepository.save(existingUser);

        RegisterRequest request = new RegisterRequest();
        request.setUsername("duplicate.user");
        request.setPassword("secret123");
        request.setEmail("new.user@example.com");
        request.setFirstName("New");
        request.setLastName("User");
        request.setPhone("0712345678");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Username already in use."))
                .andExpect(jsonPath("$.data").doesNotExist());

        assertThat(userRepository.findAll()).hasSize(1);
    }

    @Test
    @WithMockUser(username = "admin.integration", roles = "ADMIN")
    void adminShouldCreateAndRetrieveDepartment() throws Exception {
        DepartmentRequest request = new DepartmentRequest();
        request.setName("Radiology");
        request.setDescription("Imaging and diagnostics");
        request.setFloor(2);

        MvcResult createResult = mockMvc.perform(post("/api/departments")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Department created successfully."))
                .andExpect(jsonPath("$.data.name").value("Radiology"))
                .andReturn();

        Long departmentId = extractId(createResult);

        assertThat(departmentRepository.findById(departmentId)).isPresent();

        mockMvc.perform(get("/api/departments/{id}", departmentId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(departmentId))
                .andExpect(jsonPath("$.data.name").value("Radiology"))
                .andExpect(jsonPath("$.data.description").value("Imaging and diagnostics"))
                .andExpect(jsonPath("$.data.floor").value(2))
                .andExpect(jsonPath("$.data.doctorCount").value(0));
    }

    @Test
    @WithMockUser(username = "patient.integration", roles = "PATIENT")
    void authenticatedUserShouldCreateAndRetrieveAppointment() throws Exception {
        Patient patient = createPatient("patient.integration", "patient.integration@example.com", "1900101223344");
        Doctor doctor = createDoctor("doctor.integration", "doctor.integration@example.com", "LIC-100");

        AppointmentRequest request = new AppointmentRequest();
        request.setAppointmentDate(LocalDateTime.now().plusDays(1).withSecond(0).withNano(0));
        request.setDurationMinutes(30);
        request.setStatus(AppointmentStatus.SCHEDULED);
        request.setNotes("Initial consultation");
        request.setPatientId(patient.getUserId());
        request.setDoctorId(doctor.getUserId());

        MvcResult createResult = mockMvc.perform(post("/api/appointments")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Appointment created successfully."))
                .andExpect(jsonPath("$.data.patientId").value(patient.getUserId()))
                .andExpect(jsonPath("$.data.doctorId").value(doctor.getUserId()))
                .andExpect(jsonPath("$.data.status").value("SCHEDULED"))
                .andReturn();

        Long appointmentId = extractId(createResult);

        Appointment savedAppointment = appointmentRepository.findById(appointmentId).orElseThrow();
        assertThat(savedAppointment.getPatient().getUserId()).isEqualTo(patient.getUserId());
        assertThat(savedAppointment.getDoctor().getUserId()).isEqualTo(doctor.getUserId());

        mockMvc.perform(get("/api/appointments/{id}", appointmentId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(appointmentId))
                .andExpect(jsonPath("$.data.patientId").value(patient.getUserId()))
                .andExpect(jsonPath("$.data.doctorId").value(doctor.getUserId()))
                .andExpect(jsonPath("$.data.patientName").value("Patient Integration"))
                .andExpect(jsonPath("$.data.doctorName").value("Doctor Integration"));
    }

    private Long extractId(MvcResult result) throws Exception {
        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
        return root.path("data").path("id").asLong();
    }

    private Patient createPatient(String username, String email, String cnp) {
        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode("password123"));
        user.setEmail(email);
        user.setFirstName("Patient");
        user.setLastName("Integration");
        user.setPhone("0711111111");
        user.setRole(UserRole.PATIENT);
        User savedUser = userRepository.save(user);
        User managedUser = userRepository.findById(savedUser.getId()).orElseThrow();

        Patient patient = new Patient();
        patient.setUser(managedUser);
        patient.setCnp(cnp);
        patient.setDateOfBirth(LocalDate.of(1990, 1, 1));
        patient.setAddress("Integration Street 1");
        patient.setBloodType(BloodType.A_POSITIVE);
        return patientRepository.save(patient);
    }

    private Doctor createDoctor(String username, String email, String licenseNumber) {
        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode("password123"));
        user.setEmail(email);
        user.setFirstName("Doctor");
        user.setLastName("Integration");
        user.setPhone("0722222222");
        user.setRole(UserRole.DOCTOR);
        User savedUser = userRepository.save(user);
        User managedUser = userRepository.findById(savedUser.getId()).orElseThrow();

        Department department = new Department();
        department.setName("Cardiology-" + licenseNumber);
        department.setDescription("Integration department");
        department.setFloor(1);
        Department savedDepartment = departmentRepository.save(department);

        Doctor doctor = new Doctor();
        doctor.setUser(managedUser);
        doctor.setSpecialization("Cardiology");
        doctor.setLicenseNumber(licenseNumber);
        doctor.setDepartment(savedDepartment);
        return doctorRepository.save(doctor);
    }
}
