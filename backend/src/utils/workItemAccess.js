const buildWorkItemAccessFilter = (user) => {
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

const canAccessWorkItem = (workItem, user) => {
  if (user.role === "ADMINISTRATOR") {
    return true;
  }

  if (user.role === "MANAGER") {
    if (!user.team) {
      return false;
    }

    const teamId =
      user.team._id?.toString() ||
      user.team.toString();

    return (
      workItem.assignedTeam?.toString() ===
      teamId
    );
  }

  return (
    workItem.assignedTo?.toString() ===
    user._id.toString()
  );
};

module.exports = {
  buildWorkItemAccessFilter,
  canAccessWorkItem,
};