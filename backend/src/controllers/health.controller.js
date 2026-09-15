const getHealth = (req, res) => {
    res.status(200).json({
        success: true,
        message: "OJT Backend is running",
        timestamp: new Date()
    });
};

module.exports = {
    getHealth
};
