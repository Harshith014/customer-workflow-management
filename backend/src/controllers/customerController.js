const mongoose = require("mongoose");

const Customer = require("../models/Customer");
const Application = require("../models/Application");

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

const buildCustomerAccessFilter = (user) => {
  if (user.role === "ADMINISTRATOR") {
    return {};
  }

  if (user.role === "MANAGER") {
    return {
      assignedTeam: user.team?._id || user.team,
    };
  }

  return {
    assignedTo: user._id,
  };
};

const createCustomer = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      dateOfBirth,
      address,
    } = req.body;

    if (!name || !email || !phone) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email and phone are required",
      });
    }

    const customer = await Customer.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      dateOfBirth: dateOfBirth || null,
      address: {
        street: address?.street?.trim() || "",
        city: address?.city?.trim() || "",
        state: address?.state?.trim() || "",
        postalCode: address?.postalCode?.trim() || "",
        country: address?.country?.trim() || "",
      },
      createdBy: req.user._id,
    });

    const populatedCustomer = await Customer.findById(customer._id)
      .populate("createdBy", "name email");

    return res.status(201).json({
      success: true,
      message: "Customer created successfully",
      data: {
        customer: populatedCustomer,
      },
    });
  } catch (error) {
    console.error("Create customer error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create customer",
    });
  }
};

const getCustomers = async (req, res) => {
  try {
    const {
      search,
      page = 1,
      limit = 10,
    } = req.query;

    const pageNumber = Math.max(parseInt(page, 10) || 1, 1);

    const requestedLimit = parseInt(limit, 10) || 10;

    const pageLimit = Math.min(
      Math.max(requestedLimit, 1),
      100
    );

    const filter = {};

    /*
     * Administrator can see all customers.
     *
     * Managers and executives need application-based
     * access because customers themselves do not have
     * an assigned team/user.
     */
    if (req.user.role !== "ADMINISTRATOR") {
      const applicationFilter = buildCustomerAccessFilter(
        req.user
      );

      const applications = await Application.find(
        applicationFilter
      ).select("customer");

      const customerIds = [
        ...new Set(
          applications
            .map((application) =>
              application.customer?.toString()
            )
            .filter(Boolean)
        ),
      ];

      filter._id = {
        $in: customerIds,
      };
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(
        search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i"
      );

      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
      ];
    }

    const skip = (pageNumber - 1) * pageLimit;

    const [customers, total] = await Promise.all([
      Customer.find(filter)
        .populate("createdBy", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageLimit),

      Customer.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        customers,
        pagination: {
          page: pageNumber,
          limit: pageLimit,
          total,
          totalPages: Math.ceil(total / pageLimit),
        },
      },
    });
  } catch (error) {
    console.error("Get customers error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve customers",
    });
  }
};

const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
    }

    const customer = await Customer.findById(id)
      .populate("createdBy", "name email");

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    /*
     * Administrator has unrestricted access.
     */
    if (req.user.role === "ADMINISTRATOR") {
      return res.status(200).json({
        success: true,
        data: {
          customer,
        },
      });
    }

    /*
     * Determine whether the user has access to at least
     * one application belonging to this customer.
     */
    const accessFilter = {
      customer: customer._id,
      ...buildCustomerAccessFilter(req.user),
    };

    const hasAccess = await Application.exists(accessFilter);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to view this customer",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        customer,
      },
    });
  } catch (error) {
    console.error("Get customer error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve customer",
    });
  }
};

const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
    }

    const customer = await Customer.findById(id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    /*
     * Administrator can update everything.
     *
     * Other users must have access to at least one
     * application belonging to this customer.
     */
    if (req.user.role !== "ADMINISTRATOR") {
      const accessFilter = {
        customer: customer._id,
        ...buildCustomerAccessFilter(req.user),
      };

      const hasAccess = await Application.exists(accessFilter);

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message:
            "You do not have permission to update this customer",
        });
      }
    }

    const {
      name,
      email,
      phone,
      dateOfBirth,
      address,
    } = req.body;

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Name cannot be empty",
        });
      }

      customer.name = name.trim();
    }


    if (email !== undefined) {
      if (!email.trim()) {
        return res.status(400).json({
          success: false,
          message: "Email cannot be empty",
        });
      }

      customer.email = email.toLowerCase().trim();
    }

    if (phone !== undefined) {
      if (!phone.trim()) {
        return res.status(400).json({
          success: false,
          message: "Phone cannot be empty",
        });
      }

      customer.phone = phone.trim();
    }

    if (dateOfBirth !== undefined) {
      customer.dateOfBirth = dateOfBirth || null;
    }

    if (address !== undefined) {
      customer.address = {
        street:
          address.street?.trim() ??
          customer.address?.street ??
          "",

        city:
          address.city?.trim() ??
          customer.address?.city ??
          "",

        state:
          address.state?.trim() ??
          customer.address?.state ??
          "",

        postalCode:
          address.postalCode?.trim() ??
          customer.address?.postalCode ??
          "",

        country:
          address.country?.trim() ??
          customer.address?.country ??
          "",
      };
    }

    await customer.save();

    const updatedCustomer = await Customer.findById(customer._id)
      .populate("createdBy", "name email");

    return res.status(200).json({
      success: true,
      message: "Customer updated successfully",
      data: {
        customer: updatedCustomer,
      },
    });
  } catch (error) {
    console.error("Update customer error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update customer",
    });
  }
};

const getCustomerApplications = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
    }

    const customer = await Customer.findById(id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const filter = {
      customer: id,
    };

    if (req.user.role === "MANAGER") {
      filter.assignedTeam =
        req.user.team?._id || req.user.team;
    }

    if (req.user.role === "EXECUTIVE") {
      filter.assignedTo = req.user._id;
    }

    const applications = await Application.find(filter)
      .populate(
        "customer",
        "name email phone"
      )
      .populate(
        "assignedTo",
        "name email role"
      )
      .populate(
        "assignedTeam",
        "name"
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: applications.length,
      data: {
        applications,
      },
    });
  } catch (error) {
    console.error(
      "Get customer applications error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve customer applications",
    });
  }
};

module.exports = {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  getCustomerApplications,
};