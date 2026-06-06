package com.medicareplus.userservice.doctor;

import com.medicareplus.userservice.doctor.DoctorRequest;
import com.medicareplus.userservice.doctor.DoctorResponse;

import java.util.List;

public interface DoctorService {

    DoctorResponse createDoctor(DoctorRequest request);

    DoctorResponse getDoctorById(Long userId);

    List<DoctorResponse> getAllDoctors();

    DoctorResponse updateDoctor(Long userId, DoctorRequest request);

    void deleteDoctor(Long userId);
}
