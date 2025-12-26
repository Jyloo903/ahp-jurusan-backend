// src/controllers/universityController.js - FIXED VERSION
const University = require('../models/University');
const Alternative = require('../models/alternative');
const UniversityAlternative = require('../models/universityAlternative');

// CREATE UNIVERSITY (SUPERADMIN ONLY)
exports.createUniversity = async (req, res) => {
  try {
    const {
      code,
      name,
      city,
      distance_rank,
      image_url
    } = req.body;

    // VALIDASI WAJIB (HAPUS major_id)
    if (!code || !name || !city || !distance_rank) {
      return res.status(400).json({
        success: false,
        message: "code, name, city, distance_rank wajib diisi"
      });
    }

    const uni = await University.create({
      code,
      name,
      city,
      distance_rank,
      image_url
    });

    return res.json({ success: true, data: uni });

  } catch (err) {
    console.error("Create university error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// GET ALL UNIVERSITIES (PUBLIC)
exports.getUniversities = async (req, res) => {
  try {
    const list = await University.findAll({
      order: [['distance_rank', 'ASC']]
    });

    return res.json({ success: true, data: list });

  } catch (err) {
    console.error("Get universities error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// GET SINGLE UNIVERSITY (PUBLIC)
exports.getUniversityById = async (req, res) => {
  try {
    const uni = await University.findByPk(req.params.id, {
      include: [{
        model: Alternative,
        through: { attributes: ['tuition_fee', 'accreditation'] },
        attributes: ['id', 'name', 'description']
      }]
    });

    if (!uni) {
      return res.status(404).json({
        success: false,
        message: "University not found"
      });
    }

    return res.json({ success: true, data: uni });

  } catch (err) {
    console.error("Get university by ID error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// UPDATE UNIVERSITY (SUPERADMIN ONLY)
exports.updateUniversity = async (req, res) => {
  try {
    const {
      code,
      name,
      city,
      distance_rank,
      image_url
    } = req.body;

    const uni = await University.findByPk(req.params.id);

    if (!uni) {
      return res.status(404).json({
        success: false,
        message: "University not found"
      });
    }

    // UPDATE FIELD (HAPUS major_id)
    uni.code = code ?? uni.code;
    uni.name = name ?? uni.name;
    uni.city = city ?? uni.city;
    uni.distance_rank = distance_rank ?? uni.distance_rank;
    uni.image_url = image_url ?? uni.image_url;

    await uni.save();

    return res.json({ success: true, data: uni });

  } catch (err) {
    console.error("Update university error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// DELETE UNIVERSITY (SUPERADMIN ONLY)
exports.deleteUniversity = async (req, res) => {
  try {
    const uni = await University.findByPk(req.params.id);

    if (!uni) {
      return res.status(404).json({
        success: false,
        message: "University not found"
      });
    }

    await uni.destroy();

    return res.json({
      success: true,
      message: "University deleted successfully"
    });

  } catch (err) {
    console.error("Delete university error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ================= GET UNIVERSITIES BY ALTERNATIVE =================
exports.getUniversitiesByAlternative = async (req, res) => {
  try {
    const { alternative_id } = req.params;

    // Validasi input
    if (!alternative_id || isNaN(alternative_id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid alternative ID"
      });
    }

    // Cek apakah jurusan ada
    const alternative = await Alternative.findByPk(alternative_id);
    if (!alternative) {
      return res.status(404).json({
        success: false,
        message: "Major not found"
      });
    }

    // Dapatkan universitas yang punya jurusan ini
    const universities = await University.findAll({
      include: [{
        model: Alternative,
        where: { id: alternative_id },
        through: {
          attributes: ['tuition_fee', 'accreditation']
        },
        attributes: [] // Tidak perlu data alternative di response
      }],
      order: [
        ['distance_rank', 'ASC'],
        ['name', 'ASC']
      ]
    });

    // Format response
    const formattedUniversities = await Promise.all(
      universities.map(async (uni) => {
        const uniData = uni.toJSON();
        
        // Dapatkan data dari junction table
        const uniAlt = await UniversityAlternative.findOne({
          where: {
            university_id: uniData.id,
            alternative_id: alternative_id
          }
        });

        return {
          id: uniData.id,
          code: uniData.code,
          name: uniData.name,
          city: uniData.city,
          distance_rank: uniData.distance_rank,
          image_url: uniData.image_url,
          tuition_fee: uniAlt?.tuition_fee || null,
          accreditation: uniAlt?.accreditation || null
        };
      })
    );

    return res.json({
      success: true,
      data: formattedUniversities,
      major: {
        id: alternative.id,
        name: alternative.name,
        description: alternative.description
      },
      count: formattedUniversities.length,
      message: `Found ${formattedUniversities.length} universities offering ${alternative.name}`
    });

  } catch (err) {
    console.error("Get universities by alternative error:", err);
    return res.status(500).json({
      success: false,
      error: err.message,
      message: "Failed to get universities"
    });
  }
};

// ================= ADD ALTERNATIVE TO UNIVERSITY =================
exports.addAlternativeToUniversity = async (req, res) => {
  try {
    const { university_id, alternative_id, tuition_fee, accreditation } = req.body;

    // Validasi input
    if (!university_id || !alternative_id) {
      return res.status(400).json({
        success: false,
        message: "university_id and alternative_id are required"
      });
    }

    // Cek apakah university ada
    const university = await University.findByPk(university_id);
    if (!university) {
      return res.status(404).json({
        success: false,
        message: "University not found"
      });
    }

    // Cek apakah alternative ada
    const alternative = await Alternative.findByPk(alternative_id);
    if (!alternative) {
      return res.status(404).json({
        success: false,
        message: "Major not found"
      });
    }

    // Cek apakah sudah ada
    const existing = await UniversityAlternative.findOne({
      where: { university_id, alternative_id }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "This major already exists in this university"
      });
    }

    // Buat link
    const link = await UniversityAlternative.create({
      university_id,
      alternative_id,
      tuition_fee: tuition_fee || null,
      accreditation: accreditation || null
    });

    return res.json({
      success: true,
      message: "Major successfully added to university",
      data: {
        link,
        university: {
          id: university.id,
          name: university.name
        },
        alternative: {
          id: alternative.id,
          name: alternative.name
        }
      }
    });

  } catch (err) {
    console.error("Add alternative to university error:", err);
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// ================= GET UNIVERSITY'S ALTERNATIVES =================
exports.getUniversityAlternatives = async (req, res) => {
  try {
    const { university_id } = req.params;

    const university = await University.findByPk(university_id, {
      include: [{
        model: Alternative,
        through: { attributes: ['tuition_fee', 'accreditation'] }
      }]
    });

    if (!university) {
      return res.status(404).json({
        success: false,
        message: "University not found"
      });
    }

    return res.json({
      success: true,
      data: university.Alternatives,
      university: {
        id: university.id,
        name: university.name
      }
    });

  } catch (err) {
    console.error("Get university alternatives error:", err);
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
};