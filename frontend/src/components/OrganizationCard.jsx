function OrganizationCard({
  organization
}) {

  if (!organization) {
    return (
      <div className="bg-white p-5 rounded-xl shadow">
        <h2 className="text-lg font-semibold">
          Organization
        </h2>
        <p className="text-gray-500 mt-2">
          Loading organization...
        </p>
      </div>
    );
  }

  return (

    <div className="bg-white p-5 rounded-xl shadow">

      <h2 className="text-lg font-semibold">

        Organization

      </h2>

      <p className="text-gray-800 mt-2 font-medium">
        {organization.name}
      </p>

      <p className="text-gray-500 mt-2">

        Slug: {organization.slug}

      </p>

    </div>

  );

}

export default OrganizationCard;