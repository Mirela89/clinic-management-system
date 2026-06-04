package com.medicareplus.support;

import com.medicareplus.appointment.Appointment;
import com.medicareplus.appointment.AppointmentStatus;
import com.medicareplus.audit.AuditAction;
import com.medicareplus.audit.AuditLog;
import com.medicareplus.department.Department;
import com.medicareplus.doctor.Doctor;
import com.medicareplus.doctor.schedule.DoctorSchedule;
import com.medicareplus.insurance.Insurance;
import com.medicareplus.medical.analysis.AnalysisStatus;
import com.medicareplus.medical.analysis.AnalysisType;
import com.medicareplus.medical.analysis.MedicalAnalysis;
import com.medicareplus.medical.consultation.Consultation;
import com.medicareplus.medical.medication.Medication;
import com.medicareplus.medical.medication.MedicationFrequency;
import com.medicareplus.medical.prescription.Prescription;
import com.medicareplus.medical.prescription.PrescriptionMedication;
import com.medicareplus.medical.prescription.PrescriptionMedicationId;
import com.medicareplus.notification.Notification;
import com.medicareplus.notification.NotificationStatus;
import com.medicareplus.notification.NotificationType;
import com.medicareplus.patient.BloodType;
import com.medicareplus.patient.Patient;
import com.medicareplus.user.User;
import com.medicareplus.user.UserRole;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
public final class TestDataFactory {

    private TestDataFactory() {
    }

    public static User user(Long id, String username, UserRole role) {
        User user = new User();
        user.setId(id);
        user.setUsername(username);
        user.setPassword("encoded-password");
        user.setEmail(username + "@clinic.test");
        user.setFirstName("First" + id);
        user.setLastName("Last" + id);
        user.setPhone("070000000" + id);
        user.setRole(role);
        user.setCreatedAt(LocalDateTime.of(2025, 1, 1, 10, 0));
        user.setUpdatedAt(LocalDateTime.of(2025, 1, 2, 10, 0));
        return user;
    }

    public static Department department(Long id, String name) {
        Department department = new Department();
        department.setId(id);
        department.setName(name);
        department.setDescription(name + " description");
        department.setFloor(2);
        return department;
    }

    public static Insurance insurance(Long id, String providerName, String policyNumber) {
        Insurance insurance = new Insurance();
        insurance.setId(id);
        insurance.setProviderName(providerName);
        insurance.setPolicyNumber(policyNumber);
        insurance.setCoveragePercentage(80.0);
        insurance.setExpiryDate(LocalDate.of(2030, 1, 1));
        return insurance;
    }

    public static Medication medication(Long id, String name) {
        Medication medication = new Medication();
        medication.setId(id);
        medication.setName(name);
        medication.setActiveSubstance(name + " substance");
        medication.setDosage("500mg");
        medication.setManufacturer("MediCo");
        return medication;
    }

    public static Patient patient(User user) {
        Patient patient = new Patient();
        patient.setUserId(user.getId());
        patient.setUser(user);
        patient.setCnp("1234567890123");
        patient.setDateOfBirth(LocalDate.of(1990, 5, 10));
        patient.setAddress("Main Street 1");
        patient.setBloodType(BloodType.A_POSITIVE);
        return patient;
    }

    public static Doctor doctor(User user) {
        Doctor doctor = new Doctor();
        doctor.setUserId(user.getId());
        doctor.setUser(user);
        doctor.setSpecialization("Cardiology");
        doctor.setLicenseNumber("DOC-" + user.getId());
        return doctor;
    }

    public static Appointment appointment(Long id, Patient patient, Doctor doctor) {
        Appointment appointment = new Appointment();
        appointment.setId(id);
        appointment.setAppointmentDate(LocalDateTime.of(2030, 1, 1, 9, 0));
        appointment.setDurationMinutes(30);
        appointment.setStatus(AppointmentStatus.SCHEDULED);
        appointment.setNotes("Initial visit");
        appointment.setPatient(patient);
        appointment.setDoctor(doctor);
        return appointment;
    }

    public static Consultation consultation(Long id, Appointment appointment) {
        Consultation consultation = new Consultation();
        consultation.setId(id);
        consultation.setDiagnosis("Diagnosis");
        consultation.setNotes("Consultation notes");
        consultation.setConsultationDate(LocalDateTime.of(2030, 1, 1, 10, 0));
        consultation.setAppointment(appointment);
        return consultation;
    }

    public static MedicalAnalysis analysis(Long id, Patient patient, Doctor doctor) {
        MedicalAnalysis analysis = new MedicalAnalysis();
        analysis.setId(id);
        analysis.setPatient(patient);
        analysis.setDoctor(doctor);
        analysis.setAnalysisType(AnalysisType.BLOOD_TEST);
        analysis.setStatus(AnalysisStatus.PENDING);
        analysis.setRequestedDate(LocalDate.of(2030, 1, 5));
        return analysis;
    }

    public static Prescription prescription(Long id, Consultation consultation) {
        Prescription prescription = new Prescription();
        prescription.setId(id);
        prescription.setConsultation(consultation);
        prescription.setIssueDate(LocalDate.of(2030, 1, 5));
        prescription.setExpiryDate(LocalDate.of(2030, 1, 12));
        prescription.setInstructions("Take after meals");
        return prescription;
    }

    public static PrescriptionMedication prescriptionMedication(Prescription prescription, Medication medication) {
        PrescriptionMedication item = new PrescriptionMedication();
        PrescriptionMedicationId id = new PrescriptionMedicationId();
        id.setPrescriptionId(prescription.getId());
        id.setMedicationId(medication.getId());
        item.setId(id);
        item.setPrescription(prescription);
        item.setMedication(medication);
        item.setQuantity(2);
        item.setFrequency(MedicationFrequency.TWICE_DAILY);
        item.setDurationDays(7);
        return item;
    }

    public static Notification notification(Long id, User user) {
        Notification notification = new Notification();
        notification.setId(id);
        notification.setUser(user);
        notification.setType(NotificationType.APPOINTMENT_REMINDER);
        notification.setStatus(NotificationStatus.PENDING);
        notification.setMessage("Reminder");
        notification.setCreatedAt(LocalDateTime.of(2030, 1, 1, 8, 0));
        return notification;
    }

    public static DoctorSchedule schedule(Long id, Doctor doctor) {
        DoctorSchedule schedule = new DoctorSchedule();
        schedule.setId(id);
        schedule.setDoctor(doctor);
        schedule.setDayOfWeek(DayOfWeek.MONDAY);
        schedule.setStartTime(LocalTime.of(9, 0));
        schedule.setEndTime(LocalTime.of(12, 0));
        schedule.setSlotDurationMinutes(30);
        schedule.setIsAvailable(true);
        return schedule;
    }

    public static AuditLog auditLog(Long id, User user, AuditAction action) {
        AuditLog log = new AuditLog();
        log.setId(id);
        log.setUser(user);
        log.setAction(action);
        log.setEntityType("Appointment");
        log.setEntityId(5L);
        log.setDetails("Created");
        log.setIpAddress("127.0.0.1");
        log.setCreatedAt(LocalDateTime.of(2030, 1, 1, 11, 0));
        return log;
    }
}
