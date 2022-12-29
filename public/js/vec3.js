class Vector3 {
  // vec1 + vec2
  static add (vec1, vec2) {
    return [
      vec1[0] + vec2[0],
      vec1[1] + vec2[1],
      vec1[2] + vec2[2],
    ];
  }

  static iadd (vec1, vec2) {
    vec1[0] += vec2[0];
    vec1[1] += vec2[1];
    vec1[2] += vec2[2];
  }

  // vec1 - vec2
  static sub (vec1, vec2) {
    return [
      vec1[0] - vec2[0],
      vec1[1] - vec2[1],
      vec1[2] - vec2[2],
    ];
  }

  static isub (vec1, vec2) {
    vec1[0] -= vec2[0];
    vec1[1] -= vec2[1];
    vec1[2] -= vec2[2];
  }

  // scalar * vec
  static scale (vec, scalar) {
    return [
      vec[0] * scalar,
      vec[1] * scalar,
      vec[2] * scalar,
    ];
  }

  static iscale (vec, scalar) {
    vec[0] *= scalar;
    vec[1] *= scalar;
    vec[2] *= scalar;
  }

  // get norm of vec
  static norm (vec) {
    return Math.sqrt(
      vec[0]**2
      + vec[1]**2
      + vec[2]**2
    );
  }

  // scale vec to norm 1
  static normalize (vec) {
    return Vector3.scale(vec, 1 / Vector3.norm(vec))
  }

  static inormalize (vec) {
    Vector3.iscale(vec, 1 / Vector3.norm(vec));
  }

  // vec1 x vec2
  static cross (vec1, vec2) {
    return [
      vec1[1] * vec2[2] - vec1[2] * vec2[1],
      vec1[2] * vec2[0] - vec1[0] * vec2[2],
      vec1[0] * vec2[1] - vec1[1] * vec2[0],
    ];
  }

  // vec1 . vec2
  static dot (vec1, vec2) {
    return (
      vec1[0] * vec2[0]
      + vec1[1] * vec2[1]
      + vec1[2] * vec2[2]
    );
  }
}