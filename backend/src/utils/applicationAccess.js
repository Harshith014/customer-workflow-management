const buildApplicationAccessFilter = (user) => {
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

const canAccessApplication = (application, user) => {
  if (user.role === "ADMINISTRATOR") {
    return true;
  }

  if (user.role === "MANAGER") {
    if (!user.team) {
      return false;
    }

    const teamId =
      user.team._id?.toString() || user.team.toString();

    return (
      application.assignedTeam?.toString() === teamId
    );
  }

  return (
    application.assignedTo?.toString() ===
    user._id.toString()
  );
};

module.exports = {
  buildApplicationAccessFilter,
  canAccessApplication,
};