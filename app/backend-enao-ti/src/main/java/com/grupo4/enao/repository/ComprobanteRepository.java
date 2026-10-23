package com.grupo4.enao.repository;

import com.grupo4.enao.model.Applicant;
import com.grupo4.enao.model.Comprobante;
import com.grupo4.enao.model.ComprobanteState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface ComprobanteRepository extends JpaRepository<Comprobante, Long> {

    Optional<Comprobante> findBySerial(String serial);

    Optional<Comprobante> findFirstByApplicantAndStateOrderByGeneratedAtDesc(
            Applicant applicant, ComprobanteState state);

    List<Comprobante> findByStateOrderByGeneratedAtDesc(ComprobanteState state);

    Optional<Comprobante> findBySha256AndApplicant(String sha256, Applicant applicant);
}