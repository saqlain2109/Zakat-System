// Beneficiary Duplicate Detection Utility

export const normalizePhone = (phone) => {
  if (!phone) return '';
  const digitsOnly = String(phone).replace(/\D/g, '');
  // Return last 10 digits for Indian mobile numbers
  return digitsOnly.length >= 10 ? digitsOnly.slice(-10) : digitsOnly;
};

export const normalizeName = (name) => {
  if (!name) return '';
  return String(name)
    .toLowerCase()
    .replace(/\b(mr|mrs|miss|late|shaikh|ansari|khan)\b/gi, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
};

export const findPotentialDuplicates = (newCandidate, existingBeneficiaries, excludeId = null) => {
  const duplicates = [];
  const candPhone = normalizePhone(newCandidate.phone);
  const candName = normalizeName(newCandidate.fullName);

  if (!candName && !candPhone) return duplicates;

  for (const ben of existingBeneficiaries) {
    if (excludeId && ben.id === excludeId) continue;

    const benPhone = normalizePhone(ben.phone);
    const benName = normalizeName(ben.fullName);

    // 1. Phone Match
    if (candPhone && benPhone && candPhone === benPhone) {
      duplicates.push({
        matchType: 'PHONE_MATCH',
        confidence: 'HIGH',
        reason: `Identical phone number (${ben.phone}) with existing record: ${ben.fullName} [${ben.id}]`,
        existing: ben
      });
      continue;
    }

    // 2. Exact or Substring Name Match
    if (candName.length >= 4 && benName.length >= 4) {
      if (candName === benName || benName.includes(candName) || candName.includes(benName)) {
        duplicates.push({
          matchType: 'NAME_SIMILAR',
          confidence: 'MEDIUM',
          reason: `High name similarity with existing record: ${ben.fullName} [${ben.id}] in ${ben.location || 'same area'}`,
          existing: ben
        });
      }
    }
  }

  return duplicates;
};
