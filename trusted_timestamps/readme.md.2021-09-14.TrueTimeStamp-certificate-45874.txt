-----BEGIN PGP SIGNED MESSAGE-----
Hash: SHA256

============================================================================
   Certificate
============================================================================
In conjunction with the file(s) that produce the following SHA-2 fingerprint,
and in conjunction with the verification procedures available on
TrueTimeStamp.org (copy available below), this certifies that the following
file existed and was time-stamped on:

Time: September 14, 2021 8:07:22 am GMT
Stored SHA-2 Fingerprint:
3cdf189d584457f247e9f9866c1b675bbe9e835d2925002209c53a106db484b9
Certificate Type: single-file
Constituent Files:
3cdf189d584457f247e9f9866c1b675bbe9e835d2925002209c53a106db484b9	README.md

============================================================================
   Certificate Information
============================================================================
Authority: True Time Stamp ( http://TrueTimeStamp.org )
Certificate Number: 45874
Sequential Validity Chain: f2f245021de8608d7ed94e82f25027864fb951cbde2c9e7f2903fd46fb42078a

============================================================================
   Important Note
============================================================================
1 - Backup copy of the original unaltered file must be kept to authenticate
    this certificate. 
2 - Some editing programs may inadverently alter files by including the
    "save time" in the file contents, or changing character encoding, even if
     no edits are made.  Back-up using your operating system's copy function
     rather than "Save As".

============================================================================
   Verification Procedures
============================================================================
Online - Single File Certificate:
  - Supply the ORIGINAL FILE to http://TrueTimeStamp.org for verification.

Online - Multiple File Certificate:
  - Supply THIS CERTIFICATE to http://TrueTimeStamp.org for verification.
  - Additionally, for each file that you want to prove existed at the time
    point above, you must confirm that the SHA-2 of these file(s) matches
    those listed above (see instructions "Calculate SHA-2 Fingerprint of a
    file" below).

Offline Procedures:
  - Use these procedures if http://TrueTimeStamp.org ceases to exist, or if
    you would like to independently confirm the electronic signature of this
    certificate.
  - Obtain GPG software ( https://www.gnupg.org/download )    
  - Obtain the True Time Stamp Public Key, from any of the servers below, by
        searching by email:
        EMAIL: signing-department@TrueTimeStamp.org
        KEY ID: 0x6f3b2e6ab748a8f8
        KEY Fingerprint: 0x83289060f40ded088cf246b56f3b2e6ab748a8f8
        - http://truetimestamp.org/public-keys
        - https://pgp.mit.edu
        - http://keyserver.cns.vt.edu:11371
        - http://keyserver.lsuhscshreveport.edu:11371
        - http://keyserver.ubuntu.com
        - https://keyserver.pgp.com
        - http://keyserver.searchy.nl:11371
        - http://keyserver.compbiol.bio.tu-darmstadt.de:11371
  - Download the appropriate key, save as TrueTimeStamp-key4-DSA-3072.asc
  - Optionally, verify the fingerprint of the public key.
        PUBLIC KEY SHA-2 FINGERPRINT, base64 representation, UTF-8,
        UNIX-style line breaks, without headers or footers:
        16fecee8a5fd4cc39facfd1c5db36fe2eec553cf0dfa2e7496d4a3556027790e
  - Import the downloaded public-key via command-line:
       gpg --import TrueTimeStamp-key4-DSA-3072.asc
  - Verify the authenticity of this certificate via command-lines:
       gpg --import TrueTimeStamp-key4-DSA-3072.asc
       gpg --verify myCertificateFile
  - For multi-file certificates, you may also confirm that:
  		Stored SHA-2 Fingerprint matches the "Constituent Files" section
  		   - Copy & Paste text under "Constituent Files" section into a
                separate file, and save without trailing spaces and using
                UNIX-style newlines.
  		   - Calculate SHA-2 of this file, and confirm that this matches the
  		        Stored SHA-2 fingerprint.
  - For each file that you want to confirm the time stamp, calculate its SHA-2
       fingerprint, and confirm that this is present in this certificate above.

To Calculate SHA-2 Fingerprint of a file:
   - Online at http://TrueTimeStamp.org
   - Using software such as sha256sum, or openssl, with the command-lines:
        sha256sum MyFileName
        openssl dgst -sha256 MyFileName

Sequential Validity Chain:
   - Guards against back-dating any time stamp, or removing any time stamp
         in the future.
   - Consists of SHA-2( Sequential Validity Chain of previous certificate,
         SHA-2 of current file, UNIX Time Stamp).
   - Validity Chains are intermittently submitted to other Time Stamping
         Services.
-----BEGIN PGP SIGNATURE-----
Version: GnuPG v2.0.14 (GNU/Linux)

iF4EAREIAAYFAmFAWDoACgkQbzsuardIqPjOowEAnTDfhoMhAiPEQlNQ0cXNfmf6
o8aA+4xkSI1PMjvDI14A/3KMhkH+i7VPBjmuBkGwViEBl1m35K5jW7Jf1evaFgaW
=+JVY
-----END PGP SIGNATURE-----
