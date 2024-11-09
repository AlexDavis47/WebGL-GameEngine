// Utility functions for quaternion conversions because glMatrix HATES ME :(
import { quat } from "gl-matrix";

const QuaternionUtils = {
    // Convert quaternion to Euler angles (in radians)
    toEulerRadians(quaternion) {
        const [x, y, z, w] = quaternion;

        // Roll (x-axis rotation)
        const sinr_cosp = 2 * (w * x + y * z);
        const cosr_cosp = 1 - 2 * (x * x + y * y);
        const roll = Math.atan2(sinr_cosp, cosr_cosp);

        // Pitch (y-axis rotation)
        const sinp = 2 * (w * y - z * x);
        let pitch;
        if (Math.abs(sinp) >= 1) {
            pitch = Math.PI / 2 * Math.sign(sinp); // Use 90 degrees if out of range
        } else {
            pitch = Math.asin(sinp);
        }

        // Yaw (z-axis rotation)
        const siny_cosp = 2 * (w * z + x * y);
        const cosy_cosp = 1 - 2 * (y * y + z * z);
        const yaw = Math.atan2(siny_cosp, cosy_cosp);

        return [roll, pitch, yaw];
    },

    // Convert Euler angles (in radians) to quaternion
    fromEulerRadians(x, y, z) {
        const quaternion = quat.create();

        // Calculate quaternion components
        const cr = Math.cos(x * 0.5);
        const sr = Math.sin(x * 0.5);
        const cp = Math.cos(y * 0.5);
        const sp = Math.sin(y * 0.5);
        const cy = Math.cos(z * 0.5);
        const sy = Math.sin(z * 0.5);

        quaternion[3] = cr * cp * cy + sr * sp * sy; // w
        quaternion[0] = sr * cp * cy - cr * sp * sy; // x
        quaternion[1] = cr * sp * cy + sr * cp * sy; // y
        quaternion[2] = cr * cp * sy - sr * sp * cy; // z

        return quaternion;
    },

    // Degree/Radian conversion helpers
    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    },

    toDegrees(radians) {
        return radians * (180 / Math.PI);
    }
};

export default QuaternionUtils;