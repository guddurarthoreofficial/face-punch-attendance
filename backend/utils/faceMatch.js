const calculateFaceDistance = (descriptor1, descriptor2) => {
  if (
    !Array.isArray(descriptor1) ||
    !Array.isArray(descriptor2)
  ) {
    throw new Error("Invalid face descriptors");
  }

  if (
    descriptor1.length !== 128 ||
    descriptor2.length !== 128
  ) {
    throw new Error("Face descriptors must contain 128 values");
  }

  let sum = 0;

  for (let i = 0; i < 128; i++) {
    const difference =
      descriptor1[i] - descriptor2[i];

    sum += difference * difference;
  }

  return Math.sqrt(sum);
};

const isFaceMatch = (
  registeredDescriptor,
  liveDescriptor,
  threshold = 0.6
) => {
  const distance = calculateFaceDistance(
    registeredDescriptor,
    liveDescriptor
  );

  return {
    matched: distance <= threshold,
    distance,
    threshold,
  };
};

/**
 * Compare live face against multiple registered samples.
 * The smallest distance is considered the best match.
 */
const isFaceMatchMultiple = (
  registeredSamples,
  liveDescriptor,
  threshold = 0.6
) => {
  if (!Array.isArray(registeredSamples)) {
    throw new Error("Registered face samples must be an array");
  }

  if (registeredSamples.length === 0) {
    throw new Error("No registered face samples found");
  }

  if (
    !Array.isArray(liveDescriptor) ||
    liveDescriptor.length !== 128
  ) {
    throw new Error(
      "Live face descriptor must contain 128 values"
    );
  }

  let bestDistance = Infinity;
  let bestSampleIndex = -1;

  for (let i = 0; i < registeredSamples.length; i++) {
    const sample = registeredSamples[i];

    const distance = calculateFaceDistance(
      sample,
      liveDescriptor
    );

    if (distance < bestDistance) {
      bestDistance = distance;
      bestSampleIndex = i;
    }
  }

  return {
    matched: bestDistance <= threshold,
    distance: bestDistance,
    threshold,
    bestSampleIndex,
    sampleCount: registeredSamples.length,
  };
};

module.exports = {
  calculateFaceDistance,
  isFaceMatch,
  isFaceMatchMultiple,
};