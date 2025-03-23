export default function ContactSection() {
    return (
      <div className="bg-[#385170] p-8 rounded-lg shadow-md mt-6 w-[50%] text-center">
        <h2 className="text-3xl font-bold text-white">Get in Touch</h2>
        <p className="text-white mt-3">Have questions? Reach out to us for more details.</p>
        <form className="mt-6 flex flex-col gap-4">
          <input type="text" placeholder="Your Name" className="p-3 border text-white border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input type="email" placeholder="Your Email" className="p-3 border text-white border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <textarea placeholder="Your Message" className="p-3 border text-white border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" rows="4"></textarea>
          <button className="bg-[#C599B6] text-white px-6 py-3 rounded-lg shadow-md hover:bg-[#908999] transition-all">Send Message</button>
        </form>
      </div>
    );
  }