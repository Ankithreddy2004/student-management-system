const adminRepository =
    require('../repositories/adminRepository');


// ==========================================
// 1. GET ALL TEACHERS
// ==========================================

exports.getAllTeachers = async (req, res) => {

    try {

        const results =
            await adminRepository.getAllTeachers();

        return res.status(200).json({

            success: true,

            message: 'Teachers fetched successfully.',

            data: results

        });

    } catch (error) {

        console.error('Get All Teachers Error:', {
            code: error.code,
            message: error.message
        });

        return res.status(500).json({

            success: false,

            message: 'Unable to fetch teachers.'

        });

    }

};


// ==========================================
// 2. ADMIN DASHBOARD STATISTICS
// ==========================================

exports.getDashboardStats = async (req, res) => {

    try {

        const results =
            await adminRepository.getDashboardStats();

        return res.status(200).json({

            success: true,

            message:
                'Dashboard statistics fetched successfully.',

            data: results

        });

    } catch (error) {

        console.error('Admin Dashboard Error:', {
            code: error.code,
            message: error.message
        });

        return res.status(500).json({

            success: false,

            message: 'Unable to fetch dashboard statistics.'

        });

    }

};