package com.medicareplus.patient;

import com.medicareplus.user.UserInfoResponse;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class PatientResponse {

    private Long userId;
    private UserInfoResponse user;
    private String cnp;
    private LocalDate dateOfBirth;
    private String address;
    private String bloodType;
    private Long insuranceId;
    private String insuranceProviderName;
}
