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

module.exports = {
  calculateFaceDistance,
  isFaceMatch,
};