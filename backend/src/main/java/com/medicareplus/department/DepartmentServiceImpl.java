package com.medicareplus.department;

import com.medicareplus.common.exception.BusinessException;
import com.medicareplus.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DepartmentServiceImpl implements DepartmentService {

    private final DepartmentRepository departmentRepository;

    @Override
    @CacheEvict(value = "departments", allEntries = true)
    @Transactional
    public DepartmentResponse createDepartment(DepartmentRequest request) {
        log.info("Creating department with name: {}", request.getName());
        validateDepartmentName(request.getName(), null);

        Department department = new Department();
        applyChanges(department, request);

        DepartmentResponse response = mapToResponse(departmentRepository.save(department));
        log.info("Department created successfully with id: {}", response.getId());
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public DepartmentResponse getDepartmentById(Long id) {
        log.debug("Fetching department with id: {}", id);
        return mapToResponse(findDepartment(id));
    }

    @Override
    @Cacheable("departments")
    @Transactional(readOnly = true)
    public List<DepartmentResponse> getAllDepartments() {
        log.debug("Fetching all departments");
        return departmentRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @CacheEvict(value = "departments", allEntries = true)
    @Transactional
    public DepartmentResponse updateDepartment(Long id, DepartmentRequest request) {
        log.info("Updating department with id: {}", id);
        Department department = findDepartment(id);
        validateDepartmentName(request.getName(), department.getName());

        applyChanges(department, request);

        DepartmentResponse response = mapToResponse(departmentRepository.save(department));
        log.info("Department updated successfully with id: {}", id);
        return response;
    }

    @Override
    @CacheEvict(value = "departments", allEntries = true)
    @Transactional
    public void deleteDepartment(Long id) {
        log.info("Deleting department with id: {}", id);
        findDepartment(id);
        if (departmentRepository.hasDoctors(id)) {
            throw new BusinessException("Department cannot be deleted because doctors are linked to it.");
        }
        departmentRepository.deleteById(id);
        log.info("Department deleted successfully with id: {}", id);
    }

    private Department findDepartment(Long id) {
        return departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department", id));
    }

    private void validateDepartmentName(String requestedName, String currentName) {
        if (requestedName == null || requestedName.isBlank()) {
            return;
        }
        if (!requestedName.equalsIgnoreCase(currentName) &&
                departmentRepository.existsByNameIgnoreCase(requestedName)) {
            throw new BusinessException("Department name already in use.");
        }
    }

    private void applyChanges(Department department, DepartmentRequest request) {
        department.setName(request.getName());
        department.setDescription(request.getDescription());
        department.setFloor(request.getFloor());
    }

    private DepartmentResponse mapToResponse(Department department) {
        return new DepartmentResponse(
                department.getId(),
                department.getName(),
                department.getDescription(),
                department.getFloor(),
                department.getDoctors() != null ? department.getDoctors().size() : 0
        );
    }
}