function ProfileCard({
  user
}) {

  if (!user) {
    return (
      <div className="bg-white p-5 rounded-xl shadow">
        <h2 className="text-lg font-semibold">
          Your Profile
        </h2>
        <p className="text-gray-500 mt-2">
          Loading profile...
        </p>
      </div>
    );
  }

  return (

    <div className="bg-white p-5 rounded-xl shadow">

      <h2 className="text-lg font-semibold">

        Your Profile

      </h2>

      <p className="text-gray-800 mt-2 font-medium">
        {user.name || "Unknown User"}
      </p>

      <p className="text-gray-500 mt-1">
        {user.email}
      </p>

      <p className="text-gray-500 mt-2">

        Role: {user.role || "member"}

      </p>

    </div>

  );

}

export default ProfileCard;