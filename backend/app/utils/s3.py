import boto3
import uuid

from app.config import settings


s3_client = boto3.client(

    "s3",

    aws_access_key_id=
        settings.AWS_ACCESS_KEY_ID,

    aws_secret_access_key=
        settings.AWS_SECRET_ACCESS_KEY,

    region_name=
        settings.AWS_REGION

)


def upload_file_to_s3(

    file,
    folder

):

    file_ext = file.filename.split(".")[-1]

    filename = f"{uuid.uuid4()}.{file_ext}"

    key = f"{folder}/{filename}"

    s3_client.upload_fileobj(

        file.file,

        settings.AWS_BUCKET_NAME,

        key,

        ExtraArgs={
            "ContentType":
            file.content_type
        }

    )

    print("Uploading to bucket:", settings.AWS_BUCKET_NAME)
    print("Region:", settings.AWS_REGION)

    file_url = f"https://{settings.AWS_BUCKET_NAME}.s3.amazonaws.com/{key}"

    return file_url


def upload_bytes_to_s3(

    data: bytes,

    folder: str,

    extension: str,

    content_type: str

):

    filename = f"{uuid.uuid4()}.{extension}"

    key = f"{folder}/{filename}"

    s3_client.put_object(

        Bucket=settings.AWS_BUCKET_NAME,

        Key=key,

        Body=data,

        ContentType=content_type

    )

    return f"https://{settings.AWS_BUCKET_NAME}.s3.amazonaws.com/{key}"